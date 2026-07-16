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
    event: { create: 'Create Event', edit: 'Edit Event', title: 'Title', description: 'Description', venue: 'Venue', city: 'City', country: 'Country', price: 'Price', free: 'Free', tickets: 'Tickets', book: 'Book Now', confirm: 'Confirm Booking', cancel: 'Cancel' },
    booking: { my: 'My Bookings', confirm: 'Booking Confirmed', pending: 'Pending', cancelled: 'Cancelled', reference: 'Reference', noBookings: 'No bookings yet' },
    dashboard: { title: 'Dashboard', stats: { bookings: 'Total Bookings', confirmed: 'Confirmed', pending: 'Pending', events: 'My Events' } },
    ticket: { title: 'Event Ticket', showAtEntrance: 'Show this QR code at the entrance', instructions: 'Instructions', arriveEarly: 'Arrive at least 15 minutes before', keepHandy: 'Keep this ticket handy throughout the event' },
    review: { title: 'Reviews', write: 'Write a Review', rating: 'Rating', comment: 'Your review', submit: 'Submit Review', noReviews: 'No reviews yet', average: 'Average Rating' },
    analytics: { title: 'Analytics', revenue: 'Revenue', bookings: 'Bookings', sales: 'Sales Over Time', topEvents: 'Top Events', fillRate: 'Fill Rate' },
    settings: { title: 'Settings', language: 'Language', theme: 'Theme', dark: 'Dark Mode', light: 'Light Mode', system: 'System' },
    common: { loading: 'Loading...', error: 'Something went wrong', save: 'Save', delete: 'Delete', close: 'Close', back: 'Back', share: 'Share', copy: 'Copy' },
  },

  'km': {
    app: { name: 'EventHub', tagline: 'ចុះឈ្មោះព្រឹត្តិការណ៍ល្អៗ' },
    nav: { home: 'ទំព័រដើម', events: 'ព្រឹត្តិការណ៍', create: 'បង្កើតព្រឹត្តិការណ៍', dashboard: 'ផ្ទាំងគ្រប់គ្រង', login: 'ចូល', register: 'ចាប់ផ្តើម', logout: 'ចាកចេញ' },
    hero: { title: 'ស្វែងរក និង ចុះឈ្មោះព្រឹត្តិការណ៍ល្អៗ', subtitle: 'ចាប់ពីសន្និសីទ រហូតដល់ការប្រគំតន្ត្រី — ស្វែងរក និង កក់សំបុត្រសម្រាប់ព្រឹត្តិការណ៍ល្អៗនៅក្នុងទីក្រុងរបស់អ្នក។', search: 'ស្វែងរកព្រឹត្តិការណ៍...' },
    auth: { login: 'ចូលគណនី', register: 'បង្កើតគណនី', email: 'អ៊ីមែល', password: 'ពាក្យសម្ងាត់', name: 'ឈ្មោះពេញ', username: 'ឈ្មោះអ្នកប្រើ', noAccount: 'មិនទាន់មានគណនី?', hasAccount: 'មានគណនីរួចហើយ?' },
    event: { create: 'បង្កើតព្រឹត្តិការណ៍', edit: 'កែសម្រួលព្រឹត្តិការណ៍', title: 'ចំណងជើង', description: 'ការពិពណ៌នា', venue: 'ទីកន្លែង', city: 'ទីក្រុង', country: 'ប្រទេស', price: 'តម្លៃ', free: 'ឥតគិតថ្លៃ', tickets: 'សំបុត្រ', book: 'កក់ឥឡូវ', confirm: 'បញ្ជាក់ការកក់', cancel: 'បោះបង់' },
    booking: { my: 'ការកក់របស់ខ្ញុំ', confirm: 'បានបញ្ជាក់ការកក់', pending: 'កំពុងរង់ចាំ', cancelled: 'បានបោះបង់', reference: 'លេខយោង', noBookings: 'មិនទាន់មានការកក់នៅឡើយទេ' },
    dashboard: { title: 'ផ្ទាំងគ្រប់គ្រង', stats: { bookings: 'ការកក់សរុប', confirmed: 'បានបញ្ជាក់', pending: 'កំពុងរង់ចាំ', events: 'ព្រឹត្តិការណ៍របស់ខ្ញុំ' } },
    ticket: { title: 'សំបុត្រព្រឹត្តិការណ៍', showAtEntrance: 'បង្ហាញ QR នេះនៅច្រកចូល', instructions: 'សេចក្តីណែនាំ', arriveEarly: 'មកដល់យ៉ាងតិច ១៥ នាទីមុនពេលចាប់ផ្តើម', keepHandy: 'រក្សាសំបុត្រនេះជាមួយអ្នកពេញមួយព្រឹត្តិការណ៍' },
    review: { title: 'ការវាយតម្លៃ', write: 'សរសេរការវាយតម្លៃ', rating: 'ផ្កាយ', comment: 'មតិរបស់អ្នក', submit: 'ដាក់ស្នើ', noReviews: 'មិនទាន់មានការវាយតម្លៃ', average: 'ការវាយតម្លៃជាមធ្យម' },
    analytics: { title: 'ការវិភាគ', revenue: 'ចំណូល', bookings: 'ការកក់', sales: 'ការលក់តាមពេលវេលា', topEvents: 'ព្រឹត្តិការណ៍កំពូល', fillRate: 'អត្រាបំពេញ' },
    settings: { title: 'ការកំណត់', language: 'ភាសា', theme: 'ប្រធានបទ', dark: 'របៀបងងឹត', light: 'របៀបភ្លឺ', system: 'ប្រព័ន្ធ' },
    common: { loading: 'កំពុងផ្ទុក...', error: 'មានបញ្ហាអ្វីមួយ', save: 'រក្សាទុក', delete: 'លុប', close: 'បិទ', back: 'ត្រឡប់ក្រោយ', share: 'ចែករំលែក', copy: 'ចម្លង' },
  },

  'pt-BR': {
    app: { name: 'EventHub', tagline: 'Reserve Eventos Incríveis' },
    nav: { home: 'Início', events: 'Eventos', create: 'Criar Evento', dashboard: 'Painel', login: 'Entrar', register: 'Começar', logout: 'Sair' },
    hero: { title: 'Descubra e Reserve Eventos Incríveis', subtitle: 'De conferências a shows — encontre e compre ingressos para os melhores eventos na sua cidade.', search: 'Buscar eventos...' },
    auth: { login: 'Entrar', register: 'Criar Conta', email: 'Email', password: 'Senha', name: 'Nome Completo', username: 'Usuário', noAccount: 'Não tem uma conta?', hasAccount: 'Já tem uma conta?' },
    event: { create: 'Criar Evento', edit: 'Editar Evento', title: 'Título', description: 'Descrição', venue: 'Local', city: 'Cidade', country: 'País', price: 'Preço', free: 'Grátis', tickets: 'Ingressos', book: 'Reservar Agora', confirm: 'Confirmar Reserva', cancel: 'Cancelar' },
    booking: { my: 'Minhas Reservas', confirm: 'Reserva Confirmada', pending: 'Pendente', cancelled: 'Cancelada', reference: 'Referência', noBookings: 'Nenhuma reserva ainda' },
    dashboard: { title: 'Painel', stats: { bookings: 'Total de Reservas', confirmed: 'Confirmadas', pending: 'Pendentes', events: 'Meus Eventos' } },
    ticket: { title: 'Ingresso do Evento', showAtEntrance: 'Mostre este QR code na entrada', instructions: 'Instruções', arriveEarly: 'Chegue pelo menos 15 minutos antes', keepHandy: 'Mantenha este ingresso à mão durante o evento' },
    review: { title: 'Avaliações', write: 'Escrever Avaliação', rating: 'Nota', comment: 'Seu comentário', submit: 'Enviar Avaliação', noReviews: 'Nenhuma avaliação ainda', average: 'Nota Média' },
    analytics: { title: 'Analytics', revenue: 'Receita', bookings: 'Reservas', sales: 'Vendas ao Longo do Tempo', topEvents: 'Eventos Populares', fillRate: 'Taxa de Ocupação' },
    settings: { title: 'Configurações', language: 'Idioma', theme: 'Tema', dark: 'Modo Escuro', light: 'Modo Claro', system: 'Sistema' },
    common: { loading: 'Carregando...', error: 'Algo deu errado', save: 'Salvar', delete: 'Excluir', close: 'Fechar', back: 'Voltar', share: 'Compartilhar', copy: 'Copiar' },
  },

  'hi': {
    app: { name: 'EventHub', tagline: 'शानदार इवेंट बुक करें' },
    nav: { home: 'होम', events: 'इवेंट', create: 'इवेंट बनाएं', dashboard: 'डैशबोर्ड', login: 'साइन इन', register: 'शुरू करें', logout: 'लॉग आउट' },
    hero: { title: 'शानदार इवेंट खोजें और बुक करें', subtitle: 'कॉन्फ्रेंस से कॉन्सर्ट तक — अपने शहर के सर्वश्रेष्ठ इवेंट खोजें और टिकट बुक करें।', search: 'इवेंट खोजें...' },
    auth: { login: 'साइन इन', register: 'खाता बनाएं', email: 'ईमेल', password: 'पासवर्ड', name: 'पूरा नाम', username: 'उपयोगकर्ता नाम', noAccount: 'खाता नहीं है?', hasAccount: 'पहले से खाता है?' },
    event: { create: 'इवेंट बनाएं', edit: 'इवेंट संपादित करें', title: 'शीर्षक', description: 'विवरण', venue: 'स्थान', city: 'शहर', country: 'देश', price: 'कीमत', free: 'मुफ्त', tickets: 'टिकट', book: 'अभी बुक करें', confirm: 'बुकिंग की पुष्टि करें', cancel: 'रद्द करें' },
    booking: { my: 'मेरी बुकिंग', confirm: 'बुकिंग की पुष्टि हुई', pending: 'लंबित', cancelled: 'रद्द', reference: 'संदर्भ', noBookings: 'अभी तक कोई बुकिंग नहीं' },
    dashboard: { title: 'डैशबोर्ड', stats: { bookings: 'कुल बुकिंग', confirmed: 'पुष्टि हुई', pending: 'लंबित', events: 'मेरे इवेंट' } },
    ticket: { title: 'इवेंट टिकट', showAtEntrance: 'प्रवेश द्वार पर यह QR कोड दिखाएं', instructions: 'निर्देश', arriveEarly: 'इवेंट शुरू होने से कम से कम 15 मिनट पहले आएं', keepHandy: 'पूरे इवेंट के दौरान यह टिकट अपने पास रखें' },
    review: { title: 'समीक्षाएं', write: 'समीक्षा लिखें', rating: 'रेटिंग', comment: 'आपकी समीक्षा', submit: 'समीक्षा जमा करें', noReviews: 'अभी तक कोई समीक्षा नहीं', average: 'औसत रेटिंग' },
    analytics: { title: 'एनालिटिक्स', revenue: 'रेवेन्यू', bookings: 'बुकिंग', sales: 'समय के साथ बिक्री', topEvents: 'शीर्ष इवेंट', fillRate: 'भराव दर' },
    settings: { title: 'सेटिंग्स', language: 'भाषा', theme: 'थीम', dark: 'डार्क मोड', light: 'लाइट मोड', system: 'सिस्टम' },
    common: { loading: 'लोड हो रहा है...', error: 'कुछ गलत हो गया', save: 'सहेजें', delete: 'हटाएं', close: 'बंद करें', back: 'वापस', share: 'साझा करें', copy: 'कॉपी करें' },
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
