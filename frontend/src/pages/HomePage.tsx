import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, ArrowRight, Search, TrendingUp, Sparkles, Shield, Users } from 'lucide-react';
import { eventService } from '../services/event.service';
import { categoryService } from '../services/category.service';
import type { Event, Category } from '../types';
import { format } from 'date-fns';

const StatCard: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({ icon, value, label }) => (
  <div className="card p-6 text-center hover:shadow-lg transition-shadow">
    <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
      {icon}
    </div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <div className="text-sm text-gray-500 mt-1">{label}</div>
  </div>
);

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const startDate = new Date(event.start_date);
  const isSoldOut = event.is_full;
  const isFree = event.is_free;

  return (
    <Link
      to={`/events/${event.slug}`}
      className="group card-hover overflow-hidden"
    >
      {/* Image placeholder with gradient */}
      <div className="relative h-48 gradient-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Calendar className="w-12 h-12 text-white/30" />
        </div>
        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {event.is_featured && (
            <span className="badge bg-accent-500 text-white">
              <Sparkles className="w-3 h-3 mr-1" /> Featured
            </span>
          )}
          {isFree && (
            <span className="badge bg-green-500 text-white">Free</span>
          )}
        </div>
        {isSoldOut && (
          <div className="absolute top-4 right-4">
            <span className="badge bg-red-500 text-white">Sold Out</span>
          </div>
        )}
        {/* Date badge */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
            <div className="text-xs font-medium text-gray-500">{format(startDate, 'MMM')}</div>
            <div className="text-lg font-bold text-gray-900 -mt-1">{format(startDate, 'dd')}</div>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <MapPin className="w-3.5 h-3.5" />
          <span>{event.city}, {event.country}</span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors line-clamp-2">
          {event.title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4">
          {event.short_description || event.description?.slice(0, 100) + '...'}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm">
            {isFree ? (
              <span className="font-semibold text-green-600">Free</span>
            ) : (
              <>
                <span className="font-semibold text-gray-900">${event.price.toFixed(2)}</span>
                <span className="text-gray-400">/ ticket</span>
              </>
            )}
          </div>
          <span className={`text-xs font-medium ${event.available_tickets > 10 ? 'text-gray-500' : 'text-red-500'}`}>
            {event.available_tickets} left
          </span>
        </div>
      </div>
    </Link>
  );
};

const CategoryCard: React.FC<{ category: Category }> = ({ category }) => (
  <Link
    to={`/events?category=${category.id}`}
    className="card p-5 text-center hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer"
    style={{ borderTop: `3px solid ${category.color || '#4F46E5'}` }}
  >
    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 bg-gray-50 group-hover:scale-110 transition-transform">
      <div className="w-6 h-6 rounded" style={{ backgroundColor: category.color || '#4F46E5' }} />
    </div>
    <h3 className="font-semibold text-gray-900 text-sm">{category.name}</h3>
    {category.description && (
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{category.description}</p>
    )}
  </Link>
);

const HomePage: React.FC = () => {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featured, upcoming, cats] = await Promise.all([
          eventService.getFeaturedEvents(4),
          eventService.getUpcomingEvents(8),
          categoryService.getCategories(),
        ]);
        setFeaturedEvents(featured);
        setUpcomingEvents(upcoming);
        setCategories(cats);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero min-h-[600px] flex items-center">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-400 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-400 rounded-full opacity-20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-300 rounded-full opacity-10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-accent-400" />
              <span className="text-sm text-white/90">Discover amazing events near you</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-tight mb-6">
              Your Gateway to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-300">
                Unforgettable
              </span>{' '}
              Experiences
            </h1>

            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-10 text-balance">
              From intimate workshops to grand conferences — discover, book, and experience events that matter to you.
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="flex items-center gap-3 bg-white rounded-2xl p-2 shadow-2xl hover:shadow-2xl transition-shadow">
                <div className="flex-1 flex items-center gap-3 px-4">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    id="hero-search"
                    type="text"
                    placeholder="Search events by name, city, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 outline-none text-gray-900 placeholder-gray-400 bg-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery) {
                        window.location.href = `/events?search=${encodeURIComponent(searchQuery)}`;
                      }
                    }}
                  />
                </div>
                <Link
                  to={searchQuery ? `/events?search=${encodeURIComponent(searchQuery)}` : '/events'}
                  className="btn-primary btn-sm"
                >
                  Search
                </Link>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center justify-center gap-8 mt-12 text-white/70">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-sm">Events Hosted</div>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-sm">Happy Attendees</div>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">50+</div>
                <div className="text-sm">Cities Covered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-subtitle mx-auto">
              Find exactly what you're looking for across our curated categories
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="card p-5 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-gray-200 mx-auto mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-20 mx-auto" />
                  </div>
                ))
              : categories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <section className="py-16 lg:py-20 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className="inline-flex items-center gap-2 text-brand-600 font-medium text-sm mb-3">
                  <Sparkles className="w-4 h-4" />
                  Featured Events
                </div>
                <h2 className="section-title">Handpicked for You</h2>
                <p className="section-subtitle">
                  Curated selection of the most exciting upcoming events
                </p>
              </div>
              <Link
                to="/events?featured=true"
                className="hidden sm:flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium text-sm transition-colors"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard
              icon={<Calendar className="w-6 h-6" />}
              value="500+"
              label="Events Hosted"
            />
            <StatCard
              icon={<Users className="w-6 h-6" />}
              value="10K+"
              label="Happy Attendees"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6" />}
              value="95%"
              label="Satisfaction Rate"
            />
            <StatCard
              icon={<Shield className="w-6 h-6" />}
              value="100%"
              label="Secure Booking"
            />
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section className="py-16 lg:py-20 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className="inline-flex items-center gap-2 text-brand-600 font-medium text-sm mb-3">
                  <Clock className="w-4 h-4" />
                  Coming Up
                </div>
                <h2 className="section-title">Upcoming Events</h2>
                <p className="section-subtitle">
                  Don't miss out on these amazing experiences
                </p>
              </div>
              <Link
                to="/events"
                className="hidden sm:flex items-center gap-2 btn-primary btn-sm"
              >
                View All Events <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            <div className="text-center mt-10 sm:hidden">
              <Link to="/events" className="btn-primary">
                View All Events <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl gradient-primary p-12 lg:p-16 text-center">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent-500/20 rounded-full blur-3xl" />
            </div>

            <div className="relative">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
                Ready to Create Your Own Event?
              </h2>
              <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
                Join thousands of organizers who trust EventHub to manage their events.
                Start creating memorable experiences today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="btn bg-white text-brand-700 hover:bg-gray-100 shadow-xl px-8 py-4 text-base">
                  Get Started Free
                </Link>
                <Link to="/events" className="btn border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 text-base">
                  Browse Events
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
