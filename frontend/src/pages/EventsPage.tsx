import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { eventService } from '../services/event.service';
import { categoryService } from '../services/category.service';
import { useTranslation } from '../hooks/useTranslation';
import type { Event, Category } from '../types';
import { format } from 'date-fns';

const EventsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [isFree, setIsFree] = useState(searchParams.get('is_free') === 'true');
  const [isVirtual, setIsVirtual] = useState(searchParams.get('is_virtual') === 'true');

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 12;

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, unknown> = {
          skip: (page - 1) * limit,
          limit,
          upcoming: true,
        };
        if (search) params.search = search;
        if (selectedCategory) params.category_id = selectedCategory;
        if (city) params.city = city;
        if (isFree) params.is_free = true;
        if (isVirtual) params.is_virtual = true;

        const response = await eventService.getEvents(params);
        setEvents(response.events);
        setTotal(response.total);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [page, search, selectedCategory, city, isFree, isVirtual]);

  const totalPages = Math.ceil(total / limit);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setCity('');
    setIsFree(false);
    setIsVirtual(false);
    setPage(1);
    setSearchParams({});
  };

  const hasFilters = search || selectedCategory || city || isFree || isVirtual;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="section-title">{t('events.title')}</h1>
          <p className="section-subtitle">
            {t('events.subtitle')}
          </p>
        </div>
        <Link to="/events/create" className="btn-primary btn-sm self-start">
          {t('event.create')}
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="card p-4 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('events.search')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-12"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="input lg:w-48"
          >
            <option value="">{t('events.allCategories')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {/* City Filter */}
          <input
            type="text"
            placeholder="City..."
            value={city}
            onChange={(e) => { setCity(e.target.value); setPage(1); }}
            className="input lg:w-40"
          />

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary btn-sm ${hasFilters ? 'ring-2 ring-brand-500' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100 animate-slide-down">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => { setIsFree(e.target.checked); setPage(1); }}
                className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">{t('events.freeEvents')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isVirtual}
                onChange={(e) => { setIsVirtual(e.target.checked); setPage(1); }}
                className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">{t('events.virtualEvents')}</span>
            </label>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1 ml-auto"
              >
                <X className="w-3.5 h-3.5" />
                {t('events.clearFilters')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Active Filters */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {search && (
            <span className="badge-blue flex items-center gap-1">
              Search: {search}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch('')} />
            </span>
          )}
          {selectedCategory && categories.find(c => c.id === selectedCategory) && (
            <span className="badge-purple flex items-center gap-1">
              {categories.find(c => c.id === selectedCategory)?.name}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory('')} />
            </span>
          )}
          {city && (
            <span className="badge flex items-center gap-1 bg-blue-100 text-blue-700">
              {city}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setCity('')} />
            </span>
          )}
          {isFree && (
            <span className="badge-green flex items-center gap-1">
              Free
              <X className="w-3 h-3 cursor-pointer" onClick={() => setIsFree(false)} />
            </span>
          )}
          {isVirtual && (
            <span className="badge flex items-center gap-1 bg-purple-100 text-purple-700">
              Virtual
              <X className="w-3 h-3 cursor-pointer" onClick={() => setIsVirtual(false)} />
            </span>
          )}
        </div>
      )}

      {/* Results Count */}          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {isLoading ? t('common.loading') : `${t('events.showing')} ${events.length} ${t('events.of')} ${total} events`}
      </p>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-5 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('events.noEvents')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{t('events.adjustSearch')}</p>
          {hasFilters ? (
            <button onClick={clearFilters} className="btn-primary">
              {t('events.clearFilters')}
            </button>
          ) : (
            <Link to="/events/create" className="btn-primary">
              {t('events.createFirst')}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.slug}`}
              className="group card-hover overflow-hidden"
            >
              <div className="relative h-48 bg-gradient-to-br from-brand-500 to-brand-700 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <Calendar className="absolute inset-0 m-auto w-16 h-16 text-white/20" />
                <div className="absolute top-3 left-3 flex gap-2">
                  {event.is_featured && (
                    <span className="badge bg-accent-500 text-white">Featured</span>
                  )}
                  {event.is_free && (
                    <span className="badge bg-green-500 text-white">Free</span>
                  )}
                </div>
                {event.is_full && (
                  <div className="absolute top-3 right-3">
                    <span className="badge bg-red-500 text-white">Sold Out</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{format(new Date(event.start_date), 'MMM')}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white -mt-1">{format(new Date(event.start_date), 'dd')}</div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  {event.city}, {event.country}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2">
                  {event.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                  {event.short_description || event.description?.slice(0, 100)}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${event.is_free ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                    {event.is_free ? 'Free' : `$${event.price.toFixed(2)}`}
                  </span>
                  <span className={`text-xs font-medium ${event.available_tickets > 10 ? 'text-gray-400 dark:text-gray-500' : 'text-red-500'}`}>
                    {event.available_tickets} left
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary btn-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`btn-sm min-w-[40px] ${
                  page === pageNum ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary btn-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
