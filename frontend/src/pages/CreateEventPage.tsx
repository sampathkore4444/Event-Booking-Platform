import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { eventService } from '../services/event.service';
import { categoryService } from '../services/category.service';
import { useTranslation } from '../hooks/useTranslation';
import type { Category, EventCreate } from '../types';
import toast from 'react-hot-toast';

const CreateEventPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    venue: '',
    address: '',
    city: '',
    country: '',
    is_virtual: false,
    virtual_link: '',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    total_capacity: 100,
    price: 0,
    currency: 'USD',
    category_id: '',
    is_featured: false,
  });

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 255),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const slug = formData.slug || formData.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 255);
      const eventData: EventCreate = {
        title: formData.title,
        slug,
        description: formData.description,
        short_description: formData.short_description || undefined,
        venue: formData.venue,
        address: formData.address || undefined,
        city: formData.city,
        country: formData.country,
        is_virtual: formData.is_virtual,
        virtual_link: formData.virtual_link || undefined,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        registration_deadline: formData.registration_deadline
          ? new Date(formData.registration_deadline).toISOString()
          : undefined,
        total_capacity: formData.total_capacity,
        price: formData.price,
        currency: formData.currency,
        category_id: formData.category_id || undefined,
        is_featured: formData.is_featured,
      };

      const event = await eventService.createEvent(eventData);
      toast.success(t('toast.created'));
      navigate(`/events/${event.slug}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string | Array<{ msg: string; loc: string[] }> } } };
      const detail = err?.response?.data?.detail;
      let message = t('toast.createFailed');
      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map((d) => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('common.back')}
      </button>

      <div className="mb-8">
        <h1 className="section-title">{t('create.title')}</h1>
        <p className="section-subtitle">
          {t('create.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-8 space-y-8">
        {/* Basic Information */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('create.basicInfo')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="label">{t('create.eventTitle')}</label>
              <input
                type="text"
                required
                minLength={3}
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="input"
                placeholder={t('create.titlePlaceholder')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">{t('create.shortDesc')}</label>
              <textarea
                value={formData.short_description}
                onChange={(e) => handleChange('short_description', e.target.value)}
                className="input h-20 resize-none"
                placeholder={t('create.shortDescPlaceholder')}
                maxLength={500}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">{t('create.fullDesc')}</label>
              <textarea
                required
                minLength={10}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="input h-32 resize-none"
                placeholder={t('create.fullDescPlaceholder')}
              />
            </div>
            <div>
              <label className="label">{t('create.category')}</label>
              <select
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                className="input"
              >
                <option value="">{t('create.selectCategory')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('create.slug')}</label>
              <input
                type="text"
                required
                minLength={3}
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                className="input"
                placeholder={t('create.slugPlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="border-t border-gray-100 pt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('create.dateTime')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">{t('create.startDateTime')}</label>
              <input
                type="datetime-local"
                required
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">{t('create.endDateTime')}</label>
              <input
                type="datetime-local"
                required
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">{t('create.regDeadline')}</label>
              <input
                type="datetime-local"
                value={formData.registration_deadline}
                onChange={(e) => handleChange('registration_deadline', e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="border-t border-gray-100 pt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('create.location')}</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_virtual}
                onChange={(e) => handleChange('is_virtual', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('create.isVirtualEvent')}</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">{t('create.venue')}</label>
              <input
                type="text"
                required
                minLength={2}
                value={formData.venue}
                onChange={(e) => handleChange('venue', e.target.value)}
                className="input"
                placeholder={t('create.venuePlaceholder')}
              />
              </div>
              <div>
                <label className="label">{t('create.address')}</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="input"
                  placeholder={t('create.addressPlaceholder')}
                />
              </div>
              <div>
                <label className="label">{t('create.city')}</label>
              <input
                type="text"
                required
                minLength={2}
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="input"
                placeholder={t('create.cityPlaceholder')}
              />
              </div>
              <div>
                <label className="label">{t('create.country')}</label>
              <input
                type="text"
                required
                minLength={2}
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className="input"
                placeholder={t('create.countryPlaceholder')}
              />
              </div>
              {formData.is_virtual && (
                <div className="md:col-span-2">
                  <label className="label">{t('create.virtualLink')}</label>
                  <input
                    type="url"
                    value={formData.virtual_link}
                    onChange={(e) => handleChange('virtual_link', e.target.value)}
                    className="input"
                    placeholder={t('create.virtualLinkPlaceholder')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Capacity & Pricing */}
        <div className="border-t border-gray-100 pt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('create.capacityPricing')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">{t('create.totalCapacity')}</label>
              <input
                type="number"
                required
                min={1}
                value={formData.total_capacity}
                onChange={(e) => handleChange('total_capacity', parseInt(e.target.value) || 1)}
                className="input"
              />
            </div>
            <div>
              <label className="label">{t('create.priceLabel')}</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={formData.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                className="input"
                placeholder={t('create.pricePlaceholder')}
              />
            </div>
            <div>
              <label className="label">{t('create.currency')}</label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="input"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="border-t border-gray-100 pt-8 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            {t('create.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? t('create.creating') : t('create.createEvent')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventPage;
