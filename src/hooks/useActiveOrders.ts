import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus } from '@/types';

export type ActiveOrdersView = 'kitchen' | 'cashier';

/**
 * Subscribes to "active" orders with realtime updates. What counts as
 * active depends on the view:
 *  - 'kitchen' (default): status != 'served' — the kitchen's job on an
 *    order is done the moment it's marked served, regardless of payment.
 *  - 'cashier': payment_status != 'paid' — the cashier's job on an order
 *    isn't done until it's been paid, even after the kitchen has served
 *    it. A served-but-unpaid order must stay visible here.
 *
 * Returns the current list, loading state, and functions to update order
 * status / payment status.
 */
export function useActiveOrders(view: ActiveOrdersView = 'kitchen') {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    let query = supabase
      .from('orders')
      .select(
        'id, order_number, status, payment_status, discount_amount, notes, total, item_count, created_by, created_at, updated_at, order_items(id, order_id, menu_item_id, name, price, quantity, notes, created_at)'
      );

    query =
      view === 'cashier'
        ? query.neq('payment_status', 'paid')
        : query.neq('status', 'served');

    const { data, error: fetchError } = await query.order('created_at', {
      ascending: true,
    });

    if (fetchError) {
      console.error('Failed to load orders:', fetchError.message);
      setError(fetchError.message);
      return;
    }
    setError(null);
    setOrders((data ?? []) as unknown as Order[]);
  }, [view]);

  const [realtimeStatus, setRealtimeStatus] = useState<
    'connecting' | 'connected' | 'error'
  >('connecting');

  useEffect(() => {
    fetchOrders().finally(() => setLoading(false));

    const channel = supabase
      .channel('active-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => {
          fetchOrders();
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setRealtimeStatus('error');
          console.error('Realtime subscription for orders failed:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (error) {
        console.error('Failed to update order status:', error.message);
        throw error;
      }
    },
    []
  );

  const updatePaymentStatus = useCallback(
    async (orderId: string, paymentStatus: 'unpaid' | 'paid') => {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: paymentStatus })
        .eq('id', orderId);
      if (error) {
        console.error('Failed to update payment status:', error.message);
        throw error;
      }
    },
    []
  );

  return {
    orders,
    loading,
    error,
    realtimeStatus,
    updateOrderStatus,
    updatePaymentStatus,
    refetch: fetchOrders,
  };
}
