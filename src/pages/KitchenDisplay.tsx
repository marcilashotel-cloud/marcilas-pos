import { useEffect, useState } from 'react';
import { useActiveOrders } from '@/hooks/useActiveOrders';
import { orderStatusMeta, orderStatusFlow } from '@/lib/status';
import { elapsedTime } from '@/lib/format';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { useAuth } from '@/context/AuthContext';
import {
  Bell,
  Flame,
  CheckCircle2,
  Utensils,
  ChefHat,
  Clock,
  Loader2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import type { Order, OrderStatus } from '@/types';

export function KitchenDisplay() {
  const { orders, loading, error, realtimeStatus, updateOrderStatus } = useActiveOrders('kitchen');
  const { profile } = useAuth();
  const [, setTick] = useState(0);

  // Re-render every second for live elapsed timers
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const counts = {
    new: orders.filter((o) => o.status === 'new').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    ready: orders.filter((o) => o.status === 'ready').length,
  };

  const columns: {
    status: OrderStatus;
    label: string;
    icon: typeof Bell;
    iconColor: string;
    borderColor: string;
    items: Order[];
  }[] = [
    {
      status: 'new',
      label: 'New Orders',
      icon: Bell,
      iconColor: 'text-warning-600',
      borderColor: 'border-t-warning-500',
      items: orders.filter((o) => o.status === 'new'),
    },
    {
      status: 'preparing',
      label: 'Preparing',
      icon: Flame,
      iconColor: 'text-error-600',
      borderColor: 'border-t-error-500',
      items: orders.filter((o) => o.status === 'preparing'),
    },
    {
      status: 'ready',
      label: 'Ready to Serve',
      icon: CheckCircle2,
      iconColor: 'text-success-600',
      borderColor: 'border-t-success-500',
      items: orders.filter((o) => o.status === 'ready'),
    },
  ];

  async function advanceStatus(order: Order) {
    const currentIndex = orderStatusFlow.indexOf(order.status);
    const nextStatus = orderStatusFlow[currentIndex + 1];
    if (nextStatus) {
      await updateOrderStatus(order.id, nextStatus);
    }
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in-up space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-success-50 flex items-center justify-center">
            <ChefHat className="h-6 w-6 text-success-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink-900">Kitchen Display</h1>
            <p className="mt-0.5 text-sm text-ink-500">
              {profile?.full_name ?? 'Kitchen Staff'} · Live order tickets
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-error-50 border border-error-500/20 px-4 py-3">
            <AlertCircle className="h-5 w-5 text-error-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-error-700">
                Couldn't load orders
              </p>
              <p className="text-xs text-error-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {!error && realtimeStatus === 'error' && (
          <div className="flex items-start gap-2 rounded-lg bg-warning-50 border border-warning-500/20 px-4 py-3">
            <AlertCircle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-warning-700">
                Live updates aren't connected
              </p>
              <p className="text-xs text-warning-600 mt-0.5">
                New orders won't appear automatically — refresh the page to see the latest.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="New" value={counts.new} icon={Bell} tone="warning" />
          <StatCard label="Preparing" value={counts.preparing} icon={Flame} tone="error" />
          <StatCard label="Ready" value={counts.ready} icon={CheckCircle2} tone="success" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Utensils className="h-12 w-12 text-ink-300 mb-4" />
            <p className="text-lg font-semibold text-ink-600">No active orders</p>
            <p className="text-sm text-ink-400 mt-1">
              New orders from the cashier will appear here instantly
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns.map((col) => {
              const Icon = col.icon;
              return (
                <div
                  key={col.status}
                  className={`rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200/60 border-t-4 ${col.borderColor} min-h-[300px]`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${col.iconColor}`} />
                      <h2 className="font-bold text-ink-900">{col.label}</h2>
                    </div>
                    <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-bold text-ink-600">
                      {col.items.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {col.items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-sm text-ink-400">No tickets</p>
                      </div>
                    ) : (
                      col.items.map((order) => {
                        const meta = orderStatusMeta[order.status];
                        const nextStatus =
                          orderStatusFlow[orderStatusFlow.indexOf(order.status) + 1];
                        const isStale =
                          order.status === 'new' &&
                          Date.now() - new Date(order.created_at).getTime() > 5 * 60 * 1000;

                        return (
                          <div
                            key={order.id}
                            className={`rounded-lg ${meta.bgColor} border-2 ${meta.borderColor}/30 p-4 animate-fade-in-up ${
                              isStale ? 'ring-2 ring-warning-500/40' : ''
                            }`}
                          >
                            {/* Ticket header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-ink-900 tabular-nums">
                                  #{order.order_number}
                                </span>
                              </div>
                              <div
                                className={`flex items-center gap-1 text-xs font-semibold ${meta.color}`}
                              >
                                <Clock className="h-3.5 w-3.5" />
                                {elapsedTime(order.created_at)}
                              </div>
                            </div>

                            {isStale && (
                              <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-warning-700">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Waiting 5+ minutes
                              </div>
                            )}

                            {/* Items */}
                            <div className="space-y-1.5 mb-3">
                              {(order.order_items ?? []).map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-baseline gap-2 text-sm"
                                >
                                  <span className="font-bold text-ink-900 tabular-nums flex-shrink-0">
                                    {item.quantity}×
                                  </span>
                                  <span className="text-ink-800 flex-1">{item.name}</span>
                                </div>
                              ))}
                            </div>

                            {/* Item notes */}
                            {(order.order_items ?? []).some((i) => i.notes) && (
                              <div className="mb-3 rounded-md bg-white/60 p-2.5 space-y-1">
                                {(order.order_items ?? [])
                                  .filter((i) => i.notes)
                                  .map((item) => (
                                    <div
                                      key={`note-${item.id}`}
                                      className="text-xs text-ink-600"
                                    >
                                      <span className="font-semibold">{item.name}:</span>{' '}
                                      {item.notes}
                                    </div>
                                  ))}
                              </div>
                            )}

                            {/* Order notes */}
                            {order.notes && (
                              <div className="mb-3 rounded-md bg-white/60 p-2.5">
                                <div className="text-xs font-semibold text-ink-700 mb-0.5">
                                  Order notes
                                </div>
                                <div className="text-xs text-ink-600">{order.notes}</div>
                              </div>
                            )}

                            {/* Advance button */}
                            {nextStatus && (
                              <button
                                onClick={() => advanceStatus(order)}
                                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-sm font-bold text-ink-800 hover:bg-ink-50 transition shadow-sm"
                              >
                                Mark as {orderStatusMeta[nextStatus].label}
                                <ArrowRight className="h-4 w-4" />
                              </button>
                            )}
                            {!nextStatus && (
                              <div className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white/60 py-2 text-sm font-bold text-ink-500">
                                <CheckCircle2 className="h-4 w-4" />
                                Ready for pickup
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
