export type Locale = 'en' | 'de' | 'hr' | 'ro' | 'bg' | 'tr';

export interface Product {
  id: string;
  slug: string;
  price: number;
  images: string[];
  imageUrl?: string;
  category: string;
  colors: string[];
  inStock: boolean;
  featured: boolean;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  shortDescription: Record<Locale, string>;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export interface Translation {
  nav: {
    home: string;
    shop: string;
    about: string;
    contact: string;
    cart: string;
    buildBouquet: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta: string;
  };
  home: {
    featuredTitle: string;
    featuredSubtitle: string;
    aboutTitle: string;
    aboutText: string;
    whyTitle: string;
    why1Title: string;
    why1Text: string;
    why2Title: string;
    why2Text: string;
    why3Title: string;
    why3Text: string;
    viewAll: string;
  };
  shop: {
    title: string;
    subtitle: string;
    allCategories: string;
    addToCart: string;
    outOfStock: string;
    sortBy: string;
    priceLowHigh: string;
    priceHighLow: string;
    newest: string;
    filterByColor: string;
    allColors: string;
    noProducts: string;
  };
  product: {
    addToCart: string;
    description: string;
    color: string;
    quantity: string;
    relatedProducts: string;
    backToShop: string;
  };
  cart: {
    title: string;
    empty: string;
    continueShopping: string;
    subtotal: string;
    shipping: string;
    total: string;
    checkout: string;
    remove: string;
    quantity: string;
    freeShipping: string;
    shippingCost: string;
    selectShipping: string;
    shippingNote: string;
    germanyOnly: string;
    dhl: string;
    gls: string;
    packageSize: string;
    maxDimensions: string;
    liability: string;
    liabilityUpTo: string;
    tracking: string;
    topSeller: string;
    inclVat: string;
    from: string;
    orderSummary: string;
    freeShippingNote: string;
  };
  about: {
    title: string;
    subtitle: string;
    story: string;
    storyText1: string;
    storyText2: string;
    mission: string;
    missionText: string;
    craftsmanship: string;
    craftsmanshipText: string;
  };
  contact: {
    title: string;
    subtitle: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    send: string;
    sent: string;
    info: string;
    address: string;
    phone: string;
    followUs: string;
  };
  footer: {
    description: string;
    quickLinks: string;
    contactUs: string;
    followUs: string;
    rights: string;
    madeWith: string;
  };
  bouquetBuilder: {
    title: string;
    subtitle: string;
    handmadeNote: string;
    color: string;
    roseCount: string;
    roseCountNote: string;
    ribbon: string;
    blessingRibbon: string;
    pleaseChoose: string;
    yesAdd: string;
    noThanks: string;
    wrappingPaper: string;
    extraDecoration: string;
    extraDecorationNote: string;
    greetingCard: string;
    totalPrice: string;
    addToCart: string;
    added: string;
    roses: string;
    perRose: string;
    decorations: {
      crown: string;
      goldCrown: string;
      ledLight: string;
      pearls: string;
      redButterfly: string;
      silverButterfly: string;
      noThanks: string;
    };
    cards: {
      iLoveYou: string;
      romantic: string;
      kiss: string;
      floral: string;
      elegant: string;
      classic: string;
      noThanks: string;
    };
  };
  auth: {
    login: string;
    register: string;
    logout: string;
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    loginTitle: string;
    registerTitle: string;
    noAccount: string;
    hasAccount: string;
    loginLink: string;
    registerLink: string;
    errorEmail: string;
    errorPassword: string;
    errorPasswordMatch: string;
    errorGeneric: string;
    errorUserNotFound: string;
    errorWrongPassword: string;
    errorEmailInUse: string;
    myAccount: string;
    welcome: string;
    myOrders: string;
    noOrders: string;
    orderDate: string;
    orderTotal: string;
    orderStatus: string;
    orderItems: string;
    statusPending: string;
    statusProcessing: string;
    statusShipped: string;
    statusDelivered: string;
  };
  checkout: {
    title: string;
    shippingAddress: string;
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
    placeOrder: string;
    orderSuccess: string;
    orderSuccessMessage: string;
    orderNumber: string;
    backToShop: string;
    loginRequired: string;
    loginToCheckout: string;
    germany: string;
  };
  common: {
    currency: string;
    loading: string;
  };
}
