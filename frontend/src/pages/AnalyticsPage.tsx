import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { analyticsService } from '../services/analytics.service';
import { AnalyticsSkeleton } from '../components/Skeleton';
import type { AnalyticsOverview } from '../types';
import {
  TrendingUp, Calendar, Ticket, DollarSign, Users,
  BarChart3, Clock, RefreshCw, AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { isOrganizer, isAdmin } = useAuth();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyticsService.getOverview(days);
      setOverview(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  if (!isOrganizer && !isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h2>
        <p className="text-gray-500">Only organizers and admins can view analytics.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalyticsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Unable to load analytics</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
          {error}. This could be a temporary issue — please try again.
        </p>
        <button
          onClick={fetchData}
          className="btn-primary inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  if (!overview) return null;

  // ── Empty state when account has no events or data yet ──
  const hasNoData = overview.total_events === 0 && overview.total_bookings === 0;

  const stats = [
    {
      label: t('analytics.totalEvents'),
      value: overview.total_events,
      icon: Calendar,
      color: 'text-brand-500',
      bg: 'bg-brand-100',
    },
    {
      label: t('analytics.bookings'),
      value: overview.total_bookings,
      icon: Ticket,
      color: 'text-green-500',
      bg: 'bg-green-100',
    },
    {
      label: t('analytics.revenue'),
      value: `$${overview.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-yellow-500',
      bg: 'bg-yellow-100',
    },
    {
      label: t('analytics.confirmed'),
      value: overview.confirmed_bookings,
      icon: TrendingUp,
      color: 'text-purple-500',
      bg: 'bg-purple-100',
    },
  ];

  if (hasNoData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-10 h-10 text-gray-300 dark:text-gray-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No data yet</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
          Your analytics dashboard will populate once you create events and start receiving bookings.
        </p>
        <Link
          to="/events/create"
          className="btn-primary inline-flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Create Your First Event
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">{t('analytics.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('analytics.performance').replace('{days}', days.toString())}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                days === d
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Sales Chart (simplified bar chart without recharts) */}
      {overview.sales_daily && overview.sales_daily.length > 0 && (
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-500" />
            {t('analytics.sales')}
          </h2>
          <div className="space-y-3">
            {overview.sales_daily.slice(-14).map((day) => {
              const date = new Date(day.date);
              const maxRevenue = Math.max(...overview.sales_daily.map(d => d.revenue), 1);
              const barWidth = (day.revenue / maxRevenue) * 100;
              return (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 flex-shrink-0">
                    {format(date, 'MMM d')}
                  </span>
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full gradient-primary rounded-lg transition-all duration-500"
                      style={{ width: `${Math.max(barWidth, 2)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-28 justify-end flex-shrink-0">
                    <span className="text-xs font-medium text-gray-700">
                      ${day.revenue.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      ({day.bookings})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Events */}
      {overview.top_events && overview.top_events.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-500" />
            {t('analytics.topPerforming')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">{t('analytics.eventLabel')}</th>
                  <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">{t('analytics.bookingsLabel')}</th>
                  <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">{t('analytics.revenueLabel')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {overview.top_events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 pr-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{event.title}</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-sm text-gray-600">{event.total_bookings}</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        ${event.total_revenue.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending / Organizers summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <div className="card p-5">
          <Users className="w-8 h-8 text-blue-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{overview.total_organizers}</div>
          <div className="text-sm text-gray-500">Active Organizers</div>
        </div>
        <div className="card p-5">
          <Clock className="w-8 h-8 text-yellow-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{overview.pending_bookings}</div>
          <div className="text-sm text-gray-500">Pending Bookings</div>
        </div>
        <div className="card p-5">
          <Calendar className="w-8 h-8 text-purple-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{overview.total_events}</div>
          <div className="text-sm text-gray-500">Total Events</div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
