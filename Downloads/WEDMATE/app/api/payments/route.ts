import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { demoStore } from '@/lib/demo-store';
import { Payment, PaymentTransaction, PaymentMethod } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');
  const type = searchParams.get('type'); // 'payments' | 'transactions' | null (both)

  let payments: Payment[] = [];
  let transactions: PaymentTransaction[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();

      // 1. Auto-heal: Ensure every CONFIRMED (or active) booking has an invoice in payments table
      try {
        const { data: dbBookings } = await supabase
          .from('bookings')
          .select('id, customer_id, total_price, status, wedding_date')
          .eq('status', 'CONFIRMED');

        if (dbBookings && dbBookings.length > 0) {
          const { data: existingPayments } = await supabase.from('payments').select('booking_id');
          const existingBookingIds = new Set((existingPayments || []).map((p: any) => p.booking_id));

          for (const b of dbBookings) {
            if (!existingBookingIds.has(b.id)) {
              const invoiceNum = `INV/${new Date().getFullYear()}/WM-${Math.floor(1000 + Math.random() * 9000)}`;
              const billAmount = Number(b.total_price) || 25000000;
              await supabase.from('payments').insert({
                id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'm' + Date.now(),
                booking_id: b.id,
                customer_id: b.customer_id,
                invoice_number: invoiceNum,
                total_amount: billAmount,
                amount_paid: 0,
                remaining_balance: billAmount,
                status: 'UNPAID',
                due_date: b.wedding_date || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }
        }
      } catch (autoHealErr) {
        console.warn('Payment auto-heal warning:', autoHealErr);
      }

      // 2. Fetch all transactions first to dynamically verify paid sums
      if (type !== 'payments') {
        let tQuery = supabase
          .from('payment_transactions')
          .select('*, customer:profiles(*), payment:payments(*)')
          .order('created_at', { ascending: false });
        if (customerId) tQuery = tQuery.eq('customer_id', customerId);
        const { data: tData } = await tQuery;
        if (tData) {
          transactions = tData.map((t: any) => ({
            id: t.id,
            payment_id: t.payment_id,
            customer_id: t.customer_id,
            transaction_number: t.transaction_number,
            payment_method: t.payment_method,
            amount: Number(t.amount),
            proof_url: t.proof_url,
            notes: t.notes,
            status: t.status,
            verified_by: t.verified_by,
            verified_at: t.verified_at,
            rejection_reason: t.rejection_reason,
            created_at: t.created_at,
            updated_at: t.updated_at,
            customer: t.customer || undefined,
            payment: t.payment ? { ...t.payment, total_amount: Number(t.payment.total_amount) } : undefined,
          }));
        }
      }

      // 3. Fetch Payments
      if (type !== 'transactions') {
        let pQuery = supabase.from('payments').select('*').order('created_at', { ascending: false });
        if (customerId) pQuery = pQuery.eq('customer_id', customerId);
        const { data: pData } = await pQuery;
        if (pData) {
          payments = pData.map((p: any) => ({
            id: p.id,
            booking_id: p.booking_id,
            customer_id: p.customer_id,
            invoice_number: p.invoice_number,
            total_amount: Number(p.total_amount),
            amount_paid: Number(p.amount_paid),
            remaining_balance: Number(p.remaining_balance),
            status: p.status,
            due_date: p.due_date,
            created_at: p.created_at,
            updated_at: p.updated_at,
          }));
        }
      }
    } catch (e: any) {
      console.warn('GET /api/payments Supabase error:', e.message);
    }
  }

  // Merge with demoStore for zero-downtime offline support
  const localPayments = demoStore.getPayments(customerId || undefined);
  const localTransactions = demoStore.getTransactions(customerId || undefined);

  const pMap = new Map<string, Payment>();
  payments.forEach((p) => pMap.set(p.id, p));
  localPayments.forEach((p) => {
    if (!pMap.has(p.id)) pMap.set(p.id, p);
  });

  const tMap = new Map<string, PaymentTransaction>();
  transactions.forEach((t) => tMap.set(t.id, t));
  localTransactions.forEach((t) => {
    if (!tMap.has(t.id)) tMap.set(t.id, t);
  });

  // Calculate live balances for payments based on approved transactions
  const finalPayments = Array.from(pMap.values()).map((payment) => {
    const relatedApprovedTxs = Array.from(tMap.values()).filter(
      (tx) =>
        (tx.payment_id === payment.id || (payment.customer_id && tx.customer_id === payment.customer_id)) &&
        tx.status === 'APPROVED'
    );
    const sumApproved = relatedApprovedTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);

    const paid = Math.max(Number(payment.amount_paid) || 0, sumApproved);
    const total = Number(payment.total_amount) || 0;
    const remaining = Math.max(total - paid, 0);
    const status = paid >= total && total > 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID';

    return {
      ...payment,
      amount_paid: paid,
      remaining_balance: remaining,
      status: status as any,
    };
  });

  return NextResponse.json({
    ok: true,
    payments: finalPayments,
    transactions: Array.from(tMap.values()),
  });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { payment_id, customer_id, payment_method, amount, proof_url, notes } = payload;

    if (!payment_id || !customer_id || !payment_method || !amount) {
      return NextResponse.json({ ok: false, error: 'Data pembayaran tidak lengkap.' }, { status: 400 });
    }

    const txNumber = `TX/${new Date().getFullYear()}/${payment_method}-${Math.floor(10000 + Math.random() * 90000)}`;
    const txId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'tx' + Date.now();

    const proofToSave =
      proof_url && proof_url.length < 500000
        ? proof_url
        : 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80';

    let insertedTx: any = null;

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const { data: inserted, error } = await supabase
          .from('payment_transactions')
          .insert({
            id: txId,
            payment_id,
            customer_id,
            transaction_number: txNumber,
            payment_method,
            amount: Number(amount),
            proof_url: proofToSave,
            notes: notes ? notes.trim() : null,
            status: 'PENDING',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('*, customer:profiles(*), payment:payments(*)')
          .maybeSingle();

        if (!error && inserted) {
          insertedTx = inserted;
        } else if (error) {
          console.warn('POST /api/payments Supabase insert error:', error.message);
        }
      } catch (err: any) {
        console.warn('POST /api/payments exception:', err.message);
      }
    }

    // Always update demoStore
    const localTx = demoStore.createTransaction({
      payment_id,
      customer_id,
      payment_method: payment_method as PaymentMethod,
      amount: Number(amount),
      proof_url: proofToSave,
      notes,
    });

    return NextResponse.json({ ok: true, transaction: insertedTx || localTx });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { transactionId, status, adminId, rejectionReason } = await request.json();
    if (!transactionId || !status) {
      return NextResponse.json({ ok: false, error: 'Transaction ID and status are required' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        await supabase
          .from('payment_transactions')
          .update({
            status,
            verified_by: adminId || null,
            verified_at: new Date().toISOString(),
            rejection_reason: rejectionReason || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);

        // Recalculate payment status in Supabase
        const { data: tx } = await supabase
          .from('payment_transactions')
          .select('payment_id, customer_id')
          .eq('id', transactionId)
          .maybeSingle();

        if (tx) {
          let targetPaymentId = tx.payment_id;
          let parentPayment: any = null;

          if (targetPaymentId) {
            const { data: p } = await supabase.from('payments').select('*').eq('id', targetPaymentId).maybeSingle();
            parentPayment = p;
          }
          if (!parentPayment && tx.customer_id) {
            const { data: p } = await supabase.from('payments').select('*').eq('customer_id', tx.customer_id).maybeSingle();
            parentPayment = p;
            if (parentPayment) targetPaymentId = parentPayment.id;
          }

          if (parentPayment && targetPaymentId) {
            const { data: allApproved } = await supabase
              .from('payment_transactions')
              .select('amount')
              .or(`payment_id.eq.${targetPaymentId},customer_id.eq.${tx.customer_id}`)
              .eq('status', 'APPROVED');

            const totalApproved = (allApproved || []).reduce((sum, item) => sum + Number(item.amount), 0);
            const totalBill = Number(parentPayment.total_amount);
            const remaining = Math.max(totalBill - totalApproved, 0);
            const payStatus = totalApproved >= totalBill && totalBill > 0 ? 'PAID' : totalApproved > 0 ? 'PARTIAL' : 'UNPAID';

            await supabase
              .from('payments')
              .update({
                amount_paid: totalApproved,
                remaining_balance: remaining,
                status: payStatus,
                updated_at: new Date().toISOString(),
              })
              .eq('id', targetPaymentId);
          }
        }
      } catch (err: any) {
        console.warn('PATCH /api/payments exception:', err.message);
      }
    }

    // Local demoStore update
    demoStore.verifyTransaction(transactionId, status, adminId || '', rejectionReason);

    return NextResponse.json({ ok: true, status });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
