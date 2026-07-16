/**
 * Internationalization setup for EventHub.
 * Supports: English, Khmer (Cambodia), Portuguese (Brazil), Hindi (India)
 *
 * Usage:
 *   import { t } from '../i18n';
 *   <h1>{t('app.name')}</h1>
 *   <button>{t('auth.login')}</button>
 */

export type Language = 'en' | 'km' | 'pt-BR' | 'hi';

interface Translations {
  [key: string]: string | Translations;
}

const translations: Record<Language, Translations> = {
  'en': {
    app: { name: 'EventHub', tagline: 'Book Amazing Events' },
    nav: { home: 'Home', events: 'Events', create: 'Create Event', dashboard: 'Dashboard', login: 'Sign In', register: 'Get Started', logout: 'Logout' },
    hero: { title: 'Discover & Book Amazing Events', subtitle: 'From conferences to concerts — find and book tickets for the best events in your city.', search: 'Search events...' },
    auth: { login: 'Sign In', register: 'Create Account', email: 'Email', password: 'Password', name: 'Full Name', username: 'Username', noAccount: "Don't have an account?", hasAccount: 'Already have an account?' },
    event: { create: 'Create Event', edit: 'Edit Event', title: 'Title', description: 'Description', venue: 'Venue', city: 'City', country: 'Country', price: 'Price', free: 'Free', tickets: 'Tickets', book: 'Book Now', confirm: 'Confirm Booking', cancel: 'Cancel', about: 'About This Event', location: 'Location', capacity: 'Capacity', type: 'Type', perTicket: 'per ticket', bookingsOpen: 'Bookings Open', soldOut: 'Sold Out', bookingsClosed: 'Bookings Closed', share: 'Share Event', total: 'Total', freeEvent: 'Free Event', inPerson: 'In-Person Event', virtual: 'Virtual Event', ticketsRemaining: 'tickets remaining', ticketsAvailable: 'tickets available', manage: 'Manage Event', joinVirtually: 'Join Virtually', cancelBooking: 'Cancel', booking: 'Booking...', linkCopied: 'Link copied!', perTicketShort: '/ ticket', bookNow: 'Book Now', payWithBakong: 'Cambodia: Pay via Bakong QR code', payWithUPI: 'India: Pay via UPI / Card', payWithStripe: 'Pay securely via Stripe', backToEvents: 'Back to Events', search: 'Search', aboutEvent: 'About This Event' },
    events: { title: 'Browse Events', subtitle: 'Discover events that match your interests', search: 'Search events...', filters: 'Filters', allCategories: 'All Categories', freeEvents: 'Free Events', virtualEvents: 'Virtual Events', clearFilters: 'Clear all filters', noEvents: 'No events found', adjustSearch: 'Try adjusting your search or filters', createFirst: 'Create First Event', showing: 'Showing', of: 'of', free: 'Free', left: 'left', featured: 'Featured', soldOut: 'Sold Out', searching: 'Searching...', filter: 'Filters', city: 'City...', results: '{count} events', previous: 'Previous', next: 'Next', searchLabel: 'Search: {query}', clearSearch: 'Clear' },
    landing: { heroBadge: 'Discover amazing events near you', heroTitle: 'Your Gateway to Unforgettable Experiences', heroDesc: 'From intimate workshops to grand conferences — discover, book, and experience events that matter to you.', statsEvents: 'Events Hosted', statsAttendees: 'Happy Attendees', statsSatisfaction: 'Satisfaction Rate', statsSecure: 'Secure Booking', categoryTitle: 'Browse by Category', categoryDesc: 'Find exactly what you are looking for across our curated categories', featuredLabel: 'Featured Events', featuredTitle: 'Handpicked for You', featuredDesc: 'Curated selection of the most exciting upcoming events', viewAll: 'View All', upcomingLabel: 'Coming Up', upcomingTitle: 'Upcoming Events', upcomingDesc: 'Don\'t miss out on these amazing experiences', viewAllEvents: 'View All Events', ctaTitle: 'Ready to Create Your Own Event?', ctaDesc: 'Join thousands of organizers who trust EventHub to manage their events. Start creating memorable experiences today.', ctaStart: 'Get Started Free', ctaBrowse: 'Browse Events', discoverNearYou: 'Discover amazing events near you' },
    booking: { my: 'My Bookings', confirm: 'Booking Confirmed', pending: 'Pending', cancelled: 'Cancelled', reference: 'Reference', noBookings: 'No bookings yet', qrPayments: 'QR Payments', noQRPayments: 'No pending QR payments', qrPaymentsDesc: 'When attendees book tickets for your Cambodia events, their QR payments will appear here for you to confirm.', pendingQR: 'Pending Cambodia QR Payments', awaitingConfirmation: 'Awaiting confirmation', confirming: 'Confirming...', ticketCount: '{n} ticket(s)', bookedOn: 'Booked {date}', ref: 'Ref:', confirmQR: 'Confirm Payment', reject: 'Reject' },
    dashboard: { title: 'Dashboard', welcome: 'Welcome back', stats: { bookings: 'Total Bookings', confirmed: 'Confirmed', pending: 'Pending', events: 'My Events' }, tabs: { bookings: 'My Bookings', myEvents: 'My Events', qrPayments: 'QR Payments' }, noBookings: 'No bookings yet', browseEvents: 'Browse Events', noEvents: 'No events created', createFirst: 'Create Event', confirmPayment: 'Confirm Payment', reject: 'Reject', all: 'All', publish: 'Publish', noEventsDesc: 'Create your first event to get started', bookDesc: 'Browse events and book your first experience', qrEmptyDesc: 'When attendees book tickets for your Cambodia events, their QR payments will appear here for you to confirm.', confirming: 'Confirming...', rejectQR: 'Reject' },
    ticket: { title: 'Event Ticket', showAtEntrance: 'Show this QR code at the entrance', instructions: 'Instructions', arriveEarly: 'Arrive at least 15 minutes before', keepHandy: 'Keep this ticket handy throughout the event', back: 'Back to Dashboard', checkedIn: 'Checked In', save: 'Save', copyRef: 'Copy Ref', reference: 'Booking Reference', notAvailable: 'Ticket not available', goToDashboard: 'Go to Dashboard', couldNotLoad: 'Could not load your ticket', ticketDownloaded: 'Ticket downloaded!', refCopied: 'Reference copied!', ticketFor: '{n} ticket(s) for {name}', checkedInAt: 'Checked in at {time}', showQR: 'Show this QR code at the entrance to check in', instructionItems: ['Present this QR code at the event entrance', 'The organizer will scan your code to verify your ticket', 'Arrive at least 15 minutes before the event starts', 'Keep this ticket handy throughout the event'] },
    review: { title: 'Reviews', write: 'Write a Review', rating: 'Rating', comment: 'Your review', submit: 'Submit Review', noReviews: 'No reviews yet', average: 'Average Rating' },
    analytics: { title: 'Analytics', revenue: 'Revenue', bookings: 'Bookings', sales: 'Sales Over Time', topEvents: 'Top Events', fillRate: 'Fill Rate', totalEvents: 'Total Events', confirmed: 'Confirmed', noData: 'No data yet', onlyOrganizers: 'Only organizers and admins can view analytics.', performance: 'Performance overview for the last {days} days', tryAgain: 'Try Again', unableToLoad: 'Unable to load analytics', tempIssue: 'This could be a temporary issue — please try again.', noDataDesc: 'Your analytics dashboard will populate once you create events and start receiving bookings.', createFirstEvent: 'Create Your First Event', activeOrganizers: 'Active Organizers', pendingBookings: 'Pending Bookings', eventLabel: 'Event', bookingsLabel: 'Bookings', revenueLabel: 'Revenue', salesOverTime: 'Sales Over Time', topPerforming: 'Top Performing Events' },
    settings: { title: 'Settings', language: 'Language', theme: 'Theme', dark: 'Dark Mode', light: 'Light Mode', system: 'System' },
    profile: { title: 'Profile Details', edit: 'Edit Profile', cancel: 'Cancel', save: 'Save Changes', saving: 'Saving...', fullName: 'Full Name', username: 'Username', email: 'Email', phone: 'Phone', memberSince: 'Member Since', role: 'Role', accountStatus: 'Account Status', active: 'Active', inactive: 'Inactive', accountInfo: 'Account Information', notProvided: 'Not provided', verified: 'Verified', profileUpdated: 'Profile updated', updateFailed: 'Failed to update profile' },
    create: { title: 'Create New Event', subtitle: 'Fill in the details below to create your event', basicInfo: 'Basic Information', eventTitle: 'Event Title *', shortDesc: 'Short Description', fullDesc: 'Full Description *', category: 'Category', selectCategory: 'Select category', slug: 'Slug', dateTime: 'Date & Time', startDateTime: 'Start Date & Time *', endDateTime: 'End Date & Time *', regDeadline: 'Registration Deadline', location: 'Location', isVirtualEvent: 'This is a virtual event', venue: 'Venue *', venuePlaceholder: 'Venue name', address: 'Address', addressPlaceholder: 'Street address', city: 'City *', cityPlaceholder: 'City', country: 'Country *', countryPlaceholder: 'Country', virtualLink: 'Virtual Event Link', virtualLinkPlaceholder: 'https://zoom.us/j/...', capacityPricing: 'Capacity & Pricing', totalCapacity: 'Total Capacity *', priceLabel: 'Price ($)', pricePlaceholder: '0.00 for free', currency: 'Currency', cancel: 'Cancel', creating: 'Creating...', createEvent: 'Create Event', created: 'Event created successfully!', failed: 'Failed to create event', titlePlaceholder: 'Enter event title', slugPlaceholder: 'event-url-slug', shortDescPlaceholder: 'Brief description (max 500 chars)', fullDescPlaceholder: 'Detailed description of your event' },
    toast: { created: 'Event created successfully!', createFailed: 'Failed to create event', freeBooking: 'Free booking confirmed!', bookingFailed: 'Booking failed', linkCopied: 'Link copied!', writeComment: 'Please write a comment', reviewSubmitted: 'Review submitted!', reviewFailed: 'Failed to submit review', reviewUpdated: 'Review updated!', reviewUpdateFailed: 'Failed to update review', reviewDeleted: 'Review deleted', reviewDeleteFailed: 'Failed to delete review', paymentSuccess: 'Payment successful!', paymentCancelled: 'Payment was cancelled. You can try again.', bookingCancelled: 'Booking cancelled', cancelFailed: 'Failed to cancel booking', qrConfirmed: 'QR payment confirmed! Booking is now active.', qrConfirmFailed: 'Failed to confirm payment', qrRejected: 'QR payment rejected. Tickets returned to pool.', qrRejectFailed: 'Failed to reject payment', eventPublished: 'Event published!', publishFailed: 'Failed to publish', ticketError: 'Could not load your ticket', ticketDownloaded: 'Ticket downloaded!', refCopied: 'Reference copied!', welcomeBack: 'Welcome back!', loginFailed: 'Login failed', profileUpdated: 'Profile updated', profileUpdateFailed: 'Failed to update profile', accountCreated: 'Account created successfully!', registrationFailed: 'Registration failed', billCopied: 'Bill number copied!' },
    common: { loading: 'Loading...', error: 'Something went wrong', save: 'Save', delete: 'Delete', close: 'Close', back: 'Back', share: 'Share', copy: 'Copy', search: 'Search', welcome: 'Welcome back', noResults: 'No results found', retry: 'Retry', confirm: 'Confirm', cancel: 'Cancel', optional: '(optional)', demoCredentials: 'Demo Credentials:', adminCreds: 'Admin: admin@eventbooking.com / Admin123!@#' },
  },

  'km': {
    app: { name: 'EventHub', tagline: 'ចុះឈ្មោះព្រឹត្តិការណ៍ល្អៗ' },
    nav: { home: 'ទំព័រដើម', events: 'ព្រឹត្តិការណ៍', create: 'បង្កើតព្រឹត្តិការណ៍', dashboard: 'ផ្ទាំងគ្រប់គ្រង', login: 'ចូល', register: 'ចាប់ផ្តើម', logout: 'ចាកចេញ' },
    hero: { title: 'ស្វែងរក និង ចុះឈ្មោះព្រឹត្តិការណ៍ល្អៗ', subtitle: 'ចាប់ពីសន្និសីទ រហូតដល់ការប្រគំតន្ត្រី — ស្វែងរក និង កក់សំបុត្រសម្រាប់ព្រឹត្តិការណ៍ល្អៗនៅក្នុងទីក្រុងរបស់អ្នក។', search: 'ស្វែងរកព្រឹត្តិការណ៍...' },
    auth: { login: 'ចូលគណនី', register: 'បង្កើតគណនី', email: 'អ៊ីមែល', password: 'ពាក្យសម្ងាត់', name: 'ឈ្មោះពេញ', username: 'ឈ្មោះអ្នកប្រើ', noAccount: 'មិនទាន់មានគណនី?', hasAccount: 'មានគណនីរួចហើយ?' },
    event: { create: 'បង្កើតព្រឹត្តិការណ៍', edit: 'កែសម្រួលព្រឹត្តិការណ៍', title: 'ចំណងជើង', description: 'ការពិពណ៌នា', venue: 'ទីកន្លែង', city: 'ទីក្រុង', country: 'ប្រទេស', price: 'តម្លៃ', free: 'ឥតគិតថ្លៃ', tickets: 'សំបុត្រ', book: 'កក់ឥឡូវ', confirm: 'បញ្ជាក់ការកក់', cancel: 'បោះបង់' },
    events: { title: 'ស្វែងរកព្រឹត្តិការណ៍', subtitle: 'ស្វែងរកព្រឹត្តិការណ៍ដែលត្រូវនឹងចំណាប់អារម្មណ៍របស់អ្នក', search: 'ស្វែងរកព្រឹត្តិការណ៍...', filters: 'តម្រង', allCategories: 'ប្រភេទទាំងអស់', freeEvents: 'ព្រឹត្តិការណ៍ឥតគិតថ្លៃ', virtualEvents: 'ព្រឹត្តិការណ៍និម្មិត', clearFilters: 'សម្អាតតម្រងទាំងអស់', noEvents: 'រកមិនឃើញព្រឹត្តិការណ៍', adjustSearch: 'សូមព្យាយាមកែតម្រូវការស្វែងរក ឬតម្រងរបស់អ្នក', createFirst: 'បង្កើតព្រឹត្តិការណ៍ដំបូង', showing: 'បង្ហាញ', of: 'ក្នុងចំណោម', free: 'ឥតគិតថ្លៃ', left: 'នៅសល់', featured: 'ពិសេស', soldOut: 'លក់អស់' },
    booking: { my: 'ការកក់របស់ខ្ញុំ', confirm: 'បានបញ្ជាក់ការកក់', pending: 'កំពុងរង់ចាំ', cancelled: 'បានបោះបង់', reference: 'លេខយោង', noBookings: 'មិនទាន់មានការកក់នៅឡើយទេ', qrPayments: 'ការទូទាត់ QR', noQRPayments: 'មិនទាន់មានការទូទាត់ QR ដែលកំពុងរង់ចាំ' },
    dashboard: { title: 'ផ្ទាំងគ្រប់គ្រង', welcome: 'សូមស្វាគមន៍មកកាន់', stats: { bookings: 'ការកក់សរុប', confirmed: 'បានបញ្ជាក់', pending: 'កំពុងរង់ចាំ', events: 'ព្រឹត្តិការណ៍របស់ខ្ញុំ' }, tabs: { bookings: 'ការកក់របស់ខ្ញុំ', myEvents: 'ព្រឹត្តិការណ៍របស់ខ្ញុំ', qrPayments: 'ការទូទាត់ QR' }, noBookings: 'មិនទាន់មានការកក់នៅឡើយទេ', browseEvents: 'រកមើលព្រឹត្តិការណ៍', noEvents: 'មិនទាន់មានព្រឹត្តិការណ៍', createFirst: 'បង្កើតព្រឹត្តិការណ៍', confirmPayment: 'បញ្ជាក់ការទូទាត់', reject: 'បដិសេធ', all: 'ទាំងអស់', publish: 'បោះពុម្ព' },
    ticket: { title: 'សំបុត្រព្រឹត្តិការណ៍', showAtEntrance: 'បង្ហាញ QR នេះនៅច្រកចូល', instructions: 'សេចក្តីណែនាំ', arriveEarly: 'មកដល់យ៉ាងតិច ១៥ នាទីមុនពេលចាប់ផ្តើម', keepHandy: 'រក្សាសំបុត្រនេះជាមួយអ្នកពេញមួយព្រឹត្តិការណ៍', back: 'ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង', checkedIn: 'បានចូលរួច', save: 'រក្សាទុក', copyRef: 'ចម្លងលេខយោង', reference: 'លេខយោង', notAvailable: 'សំបុត្រមិនមានទេ' },
    review: { title: 'ការវាយតម្លៃ', write: 'សរសេរការវាយតម្លៃ', rating: 'ផ្កាយ', comment: 'មតិរបស់អ្នក', submit: 'ដាក់ស្នើ', noReviews: 'មិនទាន់មានការវាយតម្លៃ', average: 'ការវាយតម្លៃជាមធ្យម' },
    analytics: { title: 'ការវិភាគ', revenue: 'ចំណូល', bookings: 'ការកក់', sales: 'ការលក់តាមពេលវេលា', topEvents: 'ព្រឹត្តិការណ៍កំពូល', fillRate: 'អត្រាបំពេញ' },
    settings: { title: 'ការកំណត់', language: 'ភាសា', theme: 'ប្រធានបទ', dark: 'របៀបងងឹត', light: 'របៀបភ្លឺ', system: 'ប្រព័ន្ធ' },
    common: { loading: 'កំពុងផ្ទុក...', error: 'មានបញ្ហាអ្វីមួយ', save: 'រក្សាទុក', delete: 'លុប', close: 'បិទ', back: 'ត្រឡប់ក្រោយ', share: 'ចែករំលែក', copy: 'ចម្លង', search: 'ស្វែងរក' },
  },

  'pt-BR': {
    app: { name: 'EventHub', tagline: 'Reserve Eventos Incríveis' },
    nav: { home: 'Início', events: 'Eventos', create: 'Criar Evento', dashboard: 'Painel', login: 'Entrar', register: 'Começar', logout: 'Sair' },
    hero: { title: 'Descubra e Reserve Eventos Incríveis', subtitle: 'De conferências a shows — encontre e compre ingressos para os melhores eventos na sua cidade.', search: 'Buscar eventos...' },
    auth: { login: 'Entrar', register: 'Criar Conta', email: 'Email', password: 'Senha', name: 'Nome Completo', username: 'Usuário', noAccount: 'Não tem uma conta?', hasAccount: 'Já tem uma conta?' },
    event: { create: 'Criar Evento', edit: 'Editar Evento', title: 'Título', description: 'Descrição', venue: 'Local', city: 'Cidade', country: 'País', price: 'Preço', free: 'Grátis', tickets: 'Ingressos', book: 'Reservar Agora', confirm: 'Confirmar Reserva', cancel: 'Cancelar', about: 'Sobre Este Evento', location: 'Local', capacity: 'Capacidade', type: 'Tipo', perTicket: 'por ingresso', bookingsOpen: 'Reservas Abertas', soldOut: 'Esgotado', bookingsClosed: 'Reservas Fechadas', share: 'Compartilhar Evento', total: 'Total' },
    events: { title: 'Explorar Eventos', subtitle: 'Descubra eventos que combinam com seus interesses', search: 'Buscar eventos...', filters: 'Filtros', allCategories: 'Todas as Categorias', freeEvents: 'Eventos Grátis', virtualEvents: 'Eventos Virtuais', clearFilters: 'Limpar todos os filtros', noEvents: 'Nenhum evento encontrado', adjustSearch: 'Tente ajustar sua busca ou filtros', createFirst: 'Criar Primeiro Evento', showing: 'Mostrando', of: 'de', free: 'Grátis', left: 'restantes', featured: 'Destaque', soldOut: 'Esgotado' },
    booking: { my: 'Minhas Reservas', confirm: 'Reserva Confirmada', pending: 'Pendente', cancelled: 'Cancelada', reference: 'Referência', noBookings: 'Nenhuma reserva ainda', qrPayments: 'Pagamentos QR', noQRPayments: 'Nenhum pagamento QR pendente' },
    dashboard: { title: 'Painel', welcome: 'Bem-vindo de volta', stats: { bookings: 'Total de Reservas', confirmed: 'Confirmadas', pending: 'Pendentes', events: 'Meus Eventos' }, tabs: { bookings: 'Minhas Reservas', myEvents: 'Meus Eventos', qrPayments: 'Pagamentos QR' }, noBookings: 'Nenhuma reserva ainda', browseEvents: 'Explorar Eventos', noEvents: 'Nenhum evento criado', createFirst: 'Criar Evento', confirmPayment: 'Confirmar Pagamento', reject: 'Rejeitar', all: 'Todos', publish: 'Publicar' },
    ticket: { title: 'Ingresso do Evento', showAtEntrance: 'Mostre este QR code na entrada', instructions: 'Instruções', arriveEarly: 'Chegue pelo menos 15 minutos antes', keepHandy: 'Mantenha este ingresso à mão durante o evento', back: 'Voltar ao Painel', checkedIn: 'Check-in Realizado', save: 'Salvar', copyRef: 'Copiar Ref', reference: 'Referência', notAvailable: 'Ingresso não disponível' },
    review: { title: 'Avaliações', write: 'Escrever Avaliação', rating: 'Nota', comment: 'Seu comentário', submit: 'Enviar Avaliação', noReviews: 'Nenhuma avaliação ainda', average: 'Nota Média' },
    analytics: { title: 'Analytics', revenue: 'Receita', bookings: 'Reservas', sales: 'Vendas ao Longo do Tempo', topEvents: 'Eventos Populares', fillRate: 'Taxa de Ocupação' },
    settings: { title: 'Configurações', language: 'Idioma', theme: 'Tema', dark: 'Modo Escuro', light: 'Modo Claro', system: 'Sistema' },
    common: { loading: 'Carregando...', error: 'Algo deu errado', save: 'Salvar', delete: 'Excluir', close: 'Fechar', back: 'Voltar', share: 'Compartilhar', copy: 'Copiar', search: 'Buscar' },
  },

  'hi': {
    app: { name: 'EventHub', tagline: 'शानदार इवेंट बुक करें' },
    nav: { home: 'होम', events: 'इवेंट', create: 'इवेंट बनाएं', dashboard: 'डैशबोर्ड', login: 'साइन इन', register: 'शुरू करें', logout: 'लॉग आउट' },
    hero: { title: 'शानदार इवेंट खोजें और बुक करें', subtitle: 'कॉन्फ्रेंस से कॉन्सर्ट तक — अपने शहर के सर्वश्रेष्ठ इवेंट खोजें और टिकट बुक करें।', search: 'इवेंट खोजें...' },
    auth: { login: 'साइन इन', register: 'खाता बनाएं', email: 'ईमेल', password: 'पासवर्ड', name: 'पूरा नाम', username: 'उपयोगकर्ता नाम', noAccount: 'खाता नहीं है?', hasAccount: 'पहले से खाता है?' },
    event: { create: 'इवेंट बनाएं', edit: 'इवेंट संपादित करें', title: 'शीर्षक', description: 'विवरण', venue: 'स्थान', city: 'शहर', country: 'देश', price: 'कीमत', free: 'मुफ्त', tickets: 'टिकट', book: 'अभी बुक करें', confirm: 'बुकिंग की पुष्टि करें', cancel: 'रद्द करें', about: 'इस इवेंट के बारे में', location: 'स्थान', capacity: 'क्षमता', type: 'प्रकार', perTicket: 'प्रति टिकट', bookingsOpen: 'बुकिंग खुली हैं', soldOut: 'सोल्ड आउट', bookingsClosed: 'बुकिंग बंद', share: 'इवेंट शेयर करें', total: 'कुल' },
    events: { title: 'इवेंट ब्राउज़ करें', subtitle: 'अपनी रुचि के इवेंट खोजें', search: 'इवेंट खोजें...', filters: 'फ़िल्टर', allCategories: 'सभी श्रेणियां', freeEvents: 'मुफ्त इवेंट', virtualEvents: 'वर्चुअल इवेंट', clearFilters: 'सभी फ़िल्टर साफ़ करें', noEvents: 'कोई इवेंट नहीं मिला', adjustSearch: 'अपनी खोज या फ़िल्टर समायोजित करने का प्रयास करें', createFirst: 'पहला इवेंट बनाएं', showing: 'दिखा रहा है', of: 'का', free: 'मुफ्त', left: 'शेष', featured: 'फ़ीचर्ड', soldOut: 'सोल्ड आउट' },
    booking: { my: 'मेरी बुकिंग', confirm: 'बुकिंग की पुष्टि हुई', pending: 'लंबित', cancelled: 'रद्द', reference: 'संदर्भ', noBookings: 'अभी तक कोई बुकिंग नहीं', qrPayments: 'QR भुगतान', noQRPayments: 'कोई लंबित QR भुगतान नहीं' },
    dashboard: { title: 'डैशबोर्ड', welcome: 'आपका स्वागत है', stats: { bookings: 'कुल बुकिंग', confirmed: 'पुष्टि हुई', pending: 'लंबित', events: 'मेरे इवेंट' }, tabs: { bookings: 'मेरी बुकिंग', myEvents: 'मेरे इवेंट', qrPayments: 'QR भुगतान' }, noBookings: 'अभी तक कोई बुकिंग नहीं', browseEvents: 'इवेंट ब्राउज़ करें', noEvents: 'कोई इवेंट नहीं बनाया गया', createFirst: 'इवेंट बनाएं', confirmPayment: 'भुगतान की पुष्टि करें', reject: 'अस्वीकार करें', all: 'सभी', publish: 'प्रकाशित करें' },
    ticket: { title: 'इवेंट टिकट', showAtEntrance: 'प्रवेश द्वार पर यह QR कोड दिखाएं', instructions: 'निर्देश', arriveEarly: 'इवेंट शुरू होने से कम से कम 15 मिनट पहले आएं', keepHandy: 'पूरे इवेंट के दौरान यह टिकट अपने पास रखें', back: 'डैशबोर्ड पर वापस', checkedIn: 'चेक इन किया गया', save: 'सहेजें', copyRef: 'रेफ़ कॉपी करें', reference: 'बुकिंग संदर्भ', notAvailable: 'टिकट उपलब्ध नहीं है' },
    review: { title: 'समीक्षाएं', write: 'समीक्षा लिखें', rating: 'रेटिंग', comment: 'आपकी समीक्षा', submit: 'समीक्षा जमा करें', noReviews: 'अभी तक कोई समीक्षा नहीं', average: 'औसत रेटिंग' },
    analytics: { title: 'एनालिटिक्स', revenue: 'रेवेन्यू', bookings: 'बुकिंग', sales: 'समय के साथ बिक्री', topEvents: 'शीर्ष इवेंट', fillRate: 'भराव दर' },
    settings: { title: 'सेटिंग्स', language: 'भाषा', theme: 'थीम', dark: 'डार्क मोड', light: 'लाइट मोड', system: 'सिस्टम' },
    common: { loading: 'लोड हो रहा है...', error: 'कुछ गलत हो गया', save: 'सहेजें', delete: 'हटाएं', close: 'बंद करें', back: 'वापस', share: 'साझा करें', copy: 'कॉपी करें', search: 'खोजें' },
  },
};

// Simple i18n implementation (no external library needed)
let currentLanguage: Language = 'en';

export function setLanguage(lang: Language) {
  currentLanguage = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem('eventhub-lang', lang);
  }
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function initLanguage(): Language {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('eventhub-lang') as Language | null;
    if (stored && translations[stored]) {
      currentLanguage = stored;
      return stored;
    }
    // Auto-detect from browser
    const browserLang = navigator.language;
    if (browserLang.startsWith('km')) { currentLanguage = 'km'; }
    else if (browserLang.startsWith('pt')) { currentLanguage = 'pt-BR'; }
    else if (browserLang.startsWith('hi')) { currentLanguage = 'hi'; }
  }
  return currentLanguage;
}

export function t(path: string): string {
  const keys = path.split('.');
  let value: string | Translations = translations[currentLanguage];

  for (const key of keys) {
    if (typeof value === 'object' && value !== null && key in value) {
      value = (value as Translations)[key];
    } else {
      // Fallback to English
      value = translations['en'];
      for (const fallbackKey of keys) {
        if (typeof value === 'object' && value !== null && fallbackKey in value) {
          value = (value as Translations)[fallbackKey];
        } else {
          return path; // Key not found
        }
      }
      return typeof value === 'string' ? value : path;
    }
  }

  return typeof value === 'string' ? value : path;
}

export const languageNames: Record<Language, string> = {
  'en': 'English',
  'km': 'ភាសាខ្មែរ (Khmer)',
  'pt-BR': 'Português (Brasil)',
  'hi': 'हिन्दी (Hindi)',
};

export default translations;
