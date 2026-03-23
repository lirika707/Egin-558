/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NotificationBell } from './components/NotificationBell';
import { 
  Cloud, 
  CloudRain,
  Droplets, 
  Wind, 
  User, 
  Users,
  Sparkles, 
  ShoppingBag, 
  PlusCircle, 
  MessageSquare, 
  Home, 
  LayoutGrid, 
  Settings,
  Star,
  MapPin,
  Activity,
  ChevronRight,
  Search,
  Filter,
  ArrowLeft,
  Clock,
  Phone,
  Share2,
  Heart,
  TrendingUp,
  TrendingDown,
  List,
  Wallet,
  Globe,
  Bell,
  Camera,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  ArrowDownLeft,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Minus,
  Plus,
  Wheat,
  Milk,
  Sprout,
  Truck,
  Beef,
  Flower2,
  Bug,
  CheckCircle2,
  Newspaper,
  BookOpen,
  Lightbulb,
  ShieldCheck,
  ArrowRight,
  Package,
  Moon,
  Sun,
  SlidersHorizontal,
  Apple,
  Scan,
  FileText,
  X,
  AlertTriangle,
  Mic,
  Send,
  Shield,
  Database,
  LogOut,
  LogIn,
  Trash2,
  Check,
  Mail,
  Edit3,
  ChevronLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  signInWithYandex,
  signInWithVK,
  signInWithLinkedIn,
  signInWithInstagram,
  quickRegister,
  logOut, 
  loginWithEmail,
  registerWithEmail,
  getAuthErrorMessage,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  onAuthStateChanged,
  FirebaseUser,
  handleFirestoreError,
  OperationType,
  increment
} from './firebase';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  try {
    const classes = clsx(...inputs);
    if (typeof classes !== 'string') return '';
    return twMerge(classes);
  } catch (e) {
    console.error('Error in cn function:', e);
    return '';
  }
}

const usePosts = (userId?: string) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(collection(db, 'posts'), where('createdAt', '!=', null));
    if (userId) {
      q = query(collection(db, 'posts'), where('userId', '==', userId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      // Sort manually because of firestore index requirements for multi-field queries
      newPosts.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPosts(newPosts);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { posts, loading };
};

const useFollows = (currentUserId?: string, targetUserId?: string) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      setIsFollowing(false);
      setLoading(false);
      return;
    }

    const followId = `${currentUserId}_${targetUserId}`;
    const unsubscribe = onSnapshot(doc(db, 'follows', followId), (doc) => {
      setIsFollowing(doc.exists());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId, targetUserId]);

  const toggleFollow = async () => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) return;

    const followId = `${currentUserId}_${targetUserId}`;
    const followRef = doc(db, 'follows', followId);
    
    try {
      if (isFollowing) {
        await deleteDoc(followRef);
        await updateDoc(doc(db, 'users', currentUserId), { followingCount: increment(-1) });
        await updateDoc(doc(db, 'users', targetUserId), { followersCount: increment(-1) });
      } else {
        await setDoc(followRef, {
          followerId: currentUserId,
          followingId: targetUserId,
          createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, 'users', currentUserId), { followingCount: increment(1) });
        await updateDoc(doc(db, 'users', targetUserId), { followersCount: increment(1) });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'follows');
    }
  };

  return { isFollowing, toggleFollow, loading };
};

// --- Types ---

interface Listing {
  id: string;
  name: string;
  price: string;
  quantity: string;
  location: string;
  rating: number;
  image: string;
}

interface Product extends Listing {
  description: string;
  date: string;
  category: string;
  badge?: 'new' | 'popular' | 'top';
  sellerId?: string;
  seller: {
    name: string;
    avatar: string;
    rating: number;
    phone?: string;
  };
  createdAt?: any;
}

interface Service {
  id: string;
  name: string;
  price: string;
  location: string;
  category: string;
  description: string;
  rating: number;
  image: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  createdAt?: any;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
  suggestions?: {
    label: string;
    type: 'link' | 'tip' | 'action';
    value: string;
  }[];
}

interface UserProfile {
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  name?: string; // Keep for compatibility
  username?: string;
  avatar: string;
  location: string;
  role: string;
  email?: string;
  phone?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  listingsCount?: number;
  postsCount?: number;
  soldCount?: number;
  rating?: number;
  verified?: boolean;
  quickRegistration?: boolean;
  registrationLevel?: 'quick' | 'full' | 'social';
  provider?: string;
  joinedDate?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  image?: string;
  createdAt: any;
}

interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: any;
}

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  createdAt: any;
}

interface Order {
  id: string;
  productName: string;
  price: string;
  date: string;
  status: 'delivered' | 'processing' | 'cancelled';
  image: string;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  image: string;
  author: string;
  reactions: { type: string; count: number }[];
  comments: { id: string; user: string; text: string; date: string }[];
}

interface CommunityChat {
  id: string;
  name: string;
  lastMessage: string;
  members: number;
  image: string;
}

interface CommunityCategory {
  id: string;
  name: string;
  icon: any;
  chats: CommunityChat[];
}

type View = 'home' | 'market' | 'details' | 'sell' | 'ai' | 'settings' | 'communities' | 'news_details' | 'community_chats' | 'chat_room' | 'search' | 'admin' | 'services' | 'login' | 'feed' | 'profile';
type Theme = 'light' | 'dark' | 'system';

// --- Mock Data ---

const MOCK_LISTINGS: Listing[] = [
  {
    id: 'm1',
    name: 'Картофель "Алладин"',
    price: '16 сом/кг',
    quantity: '500 кг',
    location: 'Чуйская обл.',
    rating: 4.8,
    image: 'https://picsum.photos/seed/potato1/400/300'
  },
  {
    id: 'm2',
    name: 'Лук репчатый',
    price: '12 сом/кг',
    quantity: '1 тонна',
    location: 'Ошская обл.',
    rating: 4.6,
    image: 'https://picsum.photos/seed/onion/400/300'
  },
  {
    id: 'm3',
    name: 'Помидоры "Бычье сердце"',
    price: '85 сом/кг',
    quantity: '200 кг',
    location: 'Джалал-Абад',
    rating: 4.9,
    image: 'https://picsum.photos/seed/tomato/400/300'
  },
  {
    id: 'm4',
    name: 'Яблоки "Превосходные"',
    price: '45 сом/кг',
    quantity: '300 кг',
    location: 'Иссык-Кульская обл.',
    rating: 4.9,
    image: 'https://picsum.photos/seed/apple/400/300'
  },
  {
    id: 'm5',
    name: 'Морковь "Шантанэ"',
    price: '14 сом/кг',
    quantity: '800 кг',
    location: 'Таласская обл.',
    rating: 4.7,
    image: 'https://picsum.photos/seed/carrot/400/300'
  },
  {
    id: 'm6',
    name: 'Капуста белокочанная',
    price: '10 сом/кг',
    quantity: '2000 кг',
    location: 'Нарынская обл.',
    rating: 4.4,
    image: 'https://picsum.photos/seed/cabbage/400/300'
  },
  {
    id: 'm7',
    name: 'Чеснок зимний',
    price: '120 сом/кг',
    quantity: '50 кг',
    location: 'Чуйская обл.',
    rating: 4.8,
    image: 'https://picsum.photos/seed/garlic/400/300'
  },
  {
    id: 'm8',
    name: 'Мед горный',
    price: '450 сом/кг',
    quantity: '100 кг',
    location: 'Нарынская обл.',
    rating: 5.0,
    image: 'https://picsum.photos/seed/honey/400/300'
  }
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'm1',
    name: 'Картофель "Алладин"',
    price: '16 сом/кг',
    quantity: '500 кг',
    location: 'Чуйская обл.',
    date: 'Сегодня, 10:45',
    category: 'Овощи, фрукты, зелень',
    badge: 'popular',
    description: 'Отборный картофель, выращенный без химикатов в экологически чистом районе. Крупный, ровный, без повреждений. Отлично подходит для длительного хранения и кулинарии. Урожай этого года.',
    rating: 4.8,
    image: 'https://picsum.photos/seed/potato1/800/600',
    seller: {
      name: 'Азамат Касымов',
      avatar: 'https://picsum.photos/seed/avatar1/150/150',
      rating: 4.9,
      phone: '+996 555 123 456'
    }
  },
  {
    id: 'm2',
    name: 'Лук репчатый',
    price: '12 сом/кг',
    quantity: '1 тонна',
    location: 'Ошская обл.',
    date: 'Вчера, 18:20',
    category: 'Овощи, фрукты, зелень',
    badge: 'new',
    description: 'Крупный, сухой лук. Урожай 2023 года. Самовывоз или доставка по договоренности. Лук хорошо просушен, готов к транспортировке.',
    rating: 4.6,
    image: 'https://picsum.photos/seed/onion/800/600',
    seller: {
      name: 'Марат Садыков',
      avatar: 'https://picsum.photos/seed/avatar2/150/150',
      rating: 4.7,
      phone: '+996 700 987 654'
    }
  },
  {
    id: 'm3',
    name: 'Помидоры "Бычье сердце"',
    price: '85 сом/кг',
    quantity: '200 кг',
    location: 'Джалал-Абад',
    date: 'Сегодня, 08:15',
    category: 'Овощи, фрукты, зелень',
    badge: 'top',
    description: 'Сладкие, мясистые домашние помидоры. Выращены в теплице. Идеальны для салатов и сока. Сбор производится в день заказа.',
    rating: 4.9,
    image: 'https://picsum.photos/seed/tomato/800/600',
    seller: {
      name: 'Нурбек Алиев',
      avatar: 'https://picsum.photos/seed/avatar3/150/150',
      rating: 5.0,
      phone: '+996 777 111 222'
    }
  },
  {
    id: 'm4',
    name: 'Яблоки "Превосходные"',
    price: '40 сом/кг',
    quantity: '3 тонны',
    location: 'Иссык-Куль',
    date: '2 дня назад',
    category: 'Овощи, фрукты, зелень',
    description: 'Сочные яблоки из садов Иссык-Куля. Хрустящие, кисло-сладкие. Сорт отлично переносит транспортировку. Возможен крупный опт.',
    rating: 4.7,
    image: 'https://picsum.photos/seed/apple/800/600',
    seller: {
      name: 'Айбек Осмонов',
      avatar: 'https://picsum.photos/seed/avatar4/150/150',
      rating: 4.8,
      phone: '+996 500 333 444'
    }
  },
  {
    id: 'm5',
    name: 'Пшеница "Твердая"',
    price: '18 сом/кг',
    quantity: '10 тонн',
    location: 'Чуйская обл.',
    date: '3 дня назад',
    category: 'Зерновые и бобовые',
    description: 'Высококачественная пшеница твердых сортов. Идеальна для производства макаронных изделий. Влажность в норме.',
    rating: 4.5,
    image: 'https://picsum.photos/seed/wheat/800/600',
    seller: {
      name: 'Бакыт Токтогулов',
      avatar: 'https://picsum.photos/seed/avatar5/150/150',
      rating: 4.6
    }
  },
  {
    id: 'm6',
    name: 'Ячмень фуражный',
    price: '14 сом/кг',
    quantity: '5 тонн',
    location: 'Таласская обл.',
    date: 'Сегодня, 09:00',
    category: 'Зерновые и бобовые',
    description: 'Ячмень для корма животных. Чистый, без примесей. Урожай прошлого года.',
    rating: 4.3,
    image: 'https://picsum.photos/seed/barley/800/600',
    seller: {
      name: 'Улан Мамытов',
      avatar: 'https://picsum.photos/seed/avatar6/150/150',
      rating: 4.4
    }
  },
  {
    id: 'm100',
    name: 'Мед горный "Ат-Баши"',
    price: '650 сом/кг',
    quantity: '100 кг',
    location: 'Нарын',
    date: 'Сегодня, 11:00',
    category: 'Мед и продукты пчеловодства',
    badge: 'popular',
    description: 'Натуральный белый мед из высокогорья Ат-Баши. Обладает уникальным вкусом и лечебными свойствами. Без добавок и сахара.',
    rating: 5.0,
    image: 'https://picsum.photos/seed/honey/800/600',
    seller: {
      name: 'Эркинбек Жолдошев',
      avatar: 'https://picsum.photos/seed/avatar10/150/150',
      rating: 5.0
    }
  },
  {
    id: 'm101',
    name: 'Кумыс свежий',
    price: '120 сом/л',
    quantity: '50 л',
    location: 'Суусамыр',
    date: 'Сегодня, 06:00',
    category: 'Молочные продукты',
    badge: 'new',
    description: 'Настоящий суусамырский кумыс. Свежий, бодрящий, приготовленный по традиционным рецептам. Доставка каждое утро.',
    rating: 4.9,
    image: 'https://picsum.photos/seed/kumys/800/600',
    seller: {
      name: 'Гульмира Эсенбаева',
      avatar: 'https://picsum.photos/seed/avatar11/150/150',
      rating: 4.9
    }
  },
  {
    id: 'm7',
    name: 'Говядина (четверти)',
    price: '480 сом/кг',
    quantity: '150 кг',
    location: 'Нарынская обл.',
    date: 'Сегодня, 07:30',
    category: 'Мясо и птица',
    description: 'Свежее мясо молодых бычков. Выпас на высокогорных пастбищах Нарына. Натуральный продукт.',
    rating: 5.0,
    image: 'https://picsum.photos/seed/beef/800/600',
    seller: {
      name: 'Эрмек Садыков',
      avatar: 'https://picsum.photos/seed/avatar7/150/150',
      rating: 4.9
    }
  },
  {
    id: 'm8',
    name: 'Молоко домашнее',
    price: '65 сом/л',
    quantity: '1 литр',
    location: 'Чуйская обл.',
    date: 'Сегодня, 06:00',
    category: 'Молочные',
    description: 'Свежее коровье молоко. Жирность 3.8-4.2%. Без добавок.',
    rating: 4.9,
    image: 'https://picsum.photos/seed/milk/800/600',
    seller: {
      name: 'Елена Иванова',
      avatar: 'https://picsum.photos/seed/avatar8/150/150',
      rating: 4.8
    }
  },
  {
    id: 'm9',
    name: 'Виноград "Дамские пальчики"',
    price: '120 сом/кг',
    quantity: '50 кг',
    location: 'Баткенская обл.',
    date: 'Вчера, 14:00',
    category: 'Фрукты',
    description: 'Сладкий, сочный виноград. Прямые поставки из Баткена.',
    rating: 4.8,
    image: 'https://picsum.photos/seed/grapes/800/600',
    seller: {
      name: 'Алишер Каримов',
      avatar: 'https://picsum.photos/seed/avatar9/150/150',
      rating: 4.7
    }
  },
  {
    id: 'm10',
    name: 'Огурцы "Родничок"',
    price: '45 сом/кг',
    quantity: '100 кг',
    location: 'Чуйская обл.',
    date: 'Сегодня, 08:30',
    category: 'Овощи',
    description: 'Хрустящие огурчики, только что с грядки. Идеальны для засолки.',
    rating: 4.7,
    image: 'https://picsum.photos/seed/cucumber/800/600',
    seller: {
      name: 'Татьяна Петрова',
      avatar: 'https://picsum.photos/seed/avatar10/150/150',
      rating: 4.6
    }
  },
  {
    id: 'm11',
    name: 'Яйца домашние',
    price: '120 сом/дес',
    quantity: '10 шт',
    location: 'Чуйская обл.',
    date: 'Сегодня, 07:00',
    category: 'Продукты животноводства',
    description: 'Крупные домашние яйца от кур свободного выгула.',
    rating: 4.9,
    image: 'https://picsum.photos/seed/eggs/800/600',
    seller: {
      name: 'Сергей Волков',
      avatar: 'https://picsum.photos/seed/avatar11/150/150',
      rating: 4.9
    }
  },
  {
    id: 'm12',
    name: 'Мед горный',
    price: '600 сом/кг',
    quantity: '1 кг',
    location: 'Нарын',
    date: 'Неделю назад',
    category: 'Другое',
    description: 'Натуральный горный мед. Сбор 2023 года. Очень ароматный.',
    rating: 5.0,
    image: 'https://picsum.photos/seed/honey/800/600',
    seller: {
      name: 'Данияр Саматов',
      avatar: 'https://picsum.photos/seed/avatar12/150/150',
      rating: 5.0
    }
  }
];

const SIMILAR_LISTINGS: Listing[] = [
  {
    id: 's1',
    name: 'Картофель "Розара"',
    price: '18 сом/кг',
    quantity: '300 кг',
    location: 'Чуйская обл.',
    rating: 4.5,
    image: 'https://picsum.photos/seed/potato_sim1/400/300'
  },
  {
    id: 's2',
    name: 'Картофель молодой',
    price: '25 сом/кг',
    quantity: '100 кг',
    location: 'Ошская обл.',
    rating: 4.9,
    image: 'https://picsum.photos/seed/potato_sim2/400/300'
  }
];

const CATEGORIES = [
  'Овощи', 'Фрукты', 'Зерно', 'Молочные продукты', 'Мясо', 'Семена'
];

const SUBCATEGORIES = [
  'Картофель', 'Лук', 'Морковь', 'Помидоры', 'Капуста'
];

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Здравствуйте! Я ваш AI помощник EGIN. Чем могу помочь сегодня?',
    sender: 'ai',
    timestamp: '10:00'
  },
  {
    id: '2',
    text: 'У меня есть 2 тонны картофеля',
    sender: 'user',
    timestamp: '10:01'
  },
  {
    id: '3',
    text: 'Средняя цена на картофель в вашем регионе сейчас составляет 16-18 сом за кг. Хотите, я помогу найти покупателей или разместить объявление?',
    sender: 'ai',
    timestamp: '10:01'
  }
];

const MOCK_USER: UserProfile = {
  id: 'mock_user_1',
  firstName: 'Азамат',
  lastName: 'Касымов',
  fullName: 'Азамат Касымов',
  name: 'Азамат Касымов',
  avatar: 'https://picsum.photos/seed/avatar_user/400/400',
  location: 'Бишкек, Кыргызстан',
  role: 'Фермер'
};

const MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    productName: 'Семена пшеницы "Юбилейная"',
    price: '4500 сом',
    date: '12 Марта, 2026',
    status: 'delivered',
    image: 'https://picsum.photos/seed/order1/800/600'
  },
  {
    id: 'o2',
    productName: 'Удобрение NPK 16-16-16',
    price: '12000 сом',
    date: '5 Марта, 2026',
    status: 'delivered',
    image: 'https://picsum.photos/seed/order2/800/600'
  },
  {
    id: 'o3',
    productName: 'Система капельного орошения',
    price: '8500 сом',
    date: '28 Февраля, 2026',
    status: 'delivered',
    image: 'https://picsum.photos/seed/order3/800/600'
  }
];

const MOCK_NEWS: NewsItem[] = [
  {
    id: 'n1',
    title: 'Новые субсидии для фермеров в 2024 году',
    content: 'Правительство объявило о запуске новой программы поддержки сельскохозяйственных производителей. В рамках программы фермеры смогут получить льготные кредиты под 3% годовых на закупку техники и семян. Также предусмотрены прямые выплаты за каждый гектар обработанной земли.\n\nЭксперты отмечают, что это решение поможет значительно увеличить объемы производства в текущем сезоне. Для участия в программе необходимо подать заявку через портал государственных услуг до конца месяца.',
    date: 'Сегодня, 09:00',
    image: 'https://picsum.photos/seed/news1/800/600',
    author: 'Алексей Иванов',
    reactions: [
      { type: '👍', count: 124 },
      { type: '🔥', count: 56 },
      { type: '👏', count: 32 }
    ],
    comments: [
      { id: 'c1', user: 'Иван Петров', text: 'Отличная новость! Давно ждали такой поддержки.', date: '2 часа назад' },
      { id: 'c2', user: 'Мария Сидорова', text: 'А какие документы нужны для подачи заявки?', date: '1 час назад' }
    ]
  },
  {
    id: 'n2',
    title: 'Экспорт картофеля вырос на 15%',
    content: 'По данным таможенной службы, экспорт картофеля из региона в первом квартале 2024 года вырос на 15% по сравнению с аналогичным периодом прошлого года. Основными покупателями стали соседние страны.\n\nРост экспорта связан с улучшением качества продукции и внедрением новых технологий хранения. Фермеры отмечают, что выход на международные рынки позволяет им получать более высокую прибыль и инвестировать в развитие своих хозяйств.',
    date: 'Вчера, 14:20',
    image: 'https://picsum.photos/seed/news2/800/600',
    author: 'Елена Смирнова',
    reactions: [
      { type: '📈', count: 89 },
      { type: '🚀', count: 45 }
    ],
    comments: [
      { id: 'c3', user: 'Сергей Волков', text: 'Это хороший показатель для нашей экономики.', date: 'Вчера, 18:00' }
    ]
  },
  {
    id: 'n3',
    title: 'Прогноз погоды на посевной сезон',
    content: 'Метеорологи представили долгосрочный прогноз на весенний период. Ожидается, что весна будет ранней и теплой, что позволит начать посевные работы на 10-14 дней раньше обычного.\n\nОднако эксперты предупреждают о возможных кратковременных заморозках в середине мая. Фермерам рекомендуется заранее подготовить системы защиты растений и следить за ежедневными обновлениями прогноза.',
    date: '2 дня назад',
    image: 'https://picsum.photos/seed/news3/800/600',
    author: 'Дмитрий Соколов',
    reactions: [
      { type: '☀️', count: 210 },
      { type: '🌱', count: 145 }
    ],
    comments: []
  }
];

const MOCK_COMMUNITIES: CommunityCategory[] = [
  {
    id: 'cat1',
    name: 'Растениеводство',
    icon: Sprout,
    chats: [
      { id: 'ch1', name: 'Выращивание картофеля', lastMessage: 'Какой сорт лучше для юга?', members: 1250, image: 'https://picsum.photos/seed/comm1/150/150' },
      { id: 'ch2', name: 'Зерновые культуры', lastMessage: 'Обсуждаем сроки посева пшеницы', members: 850, image: 'https://picsum.photos/seed/comm2/150/150' },
      { id: 'ch3', name: 'Тепличное хозяйство', lastMessage: 'Как бороться с фитофторой?', members: 2100, image: 'https://picsum.photos/seed/comm3/150/150' }
    ]
  },
  {
    id: 'cat2',
    name: 'Животноводство',
    icon: Beef,
    chats: [
      { id: 'ch4', name: 'Крупный рогатый скот', lastMessage: 'Рацион для молочных коров', members: 1500, image: 'https://picsum.photos/seed/comm4/150/150' },
      { id: 'ch5', name: 'Птицеводство', lastMessage: 'Лучшие породы кур-несушек', members: 920, image: 'https://picsum.photos/seed/comm5/150/150' }
    ]
  },
  {
    id: 'cat3',
    name: 'Техника и Инновации',
    icon: Truck,
    chats: [
      { id: 'ch6', name: 'Ремонт тракторов', lastMessage: 'Где найти запчасти на МТЗ?', members: 3200, image: 'https://picsum.photos/seed/comm6/150/150' },
      { id: 'ch7', name: 'Дроны в сельском хозяйстве', lastMessage: 'Опыт использования DJI Agras', members: 450, image: 'https://picsum.photos/seed/comm7/150/150' }
    ]
  }
];

// --- Firebase Hooks ---

const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Check role in Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role);
            
            // Sync Google data if needed (e.g. if name/photo changed)
            if (user.providerData[0]?.providerId === 'google.com') {
              const updates: any = { updatedAt: serverTimestamp() };
              let hasUpdates = false;
              
              if (!data.fullName && user.displayName) {
                updates.fullName = user.displayName;
                const names = user.displayName.split(' ');
                updates.firstName = names[0] || '';
                updates.lastName = names.slice(1).join(' ') || '';
                hasUpdates = true;
              }
              if (!data.avatar && user.photoURL) {
                updates.avatar = user.photoURL;
                hasUpdates = true;
              }
              
              if (hasUpdates) {
                await updateDoc(doc(db, 'users', user.uid), updates);
              }
            }
          } else {
            // Create user doc if not exists (e.g. first time Google login)
            const names = (user.displayName || '').split(' ');
            const firstName = names[0] || '';
            const lastName = names.slice(1).join(' ') || '';
            
            const newUser = {
              uid: user.uid,
              email: user.email,
              firstName,
              lastName,
              fullName: user.displayName || 'Пользователь',
              photoURL: user.photoURL || 'https://picsum.photos/seed/user/150/150',
              avatar: user.photoURL || 'https://picsum.photos/seed/user/150/150',
              role: user.email === 'nterra558@gmail.com' ? 'admin' : 'user',
              location: 'Бишкек, Кыргызстан',
              bio: '',
              phone: user.phoneNumber || '',
              followersCount: 0,
              followingCount: 0,
              postsCount: 0,
              listingsCount: 0,
              soldCount: 0,
              rating: 0,
              verified: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', user.uid), newUser);
            setUserRole(newUser.role as 'admin' | 'user');
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { currentUser, userRole, loading };
};

const seedDatabase = async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("Пожалуйста, войдите в систему, чтобы заполнить базу данных.");
    return;
  }

  const categories = ['Овощи', 'Фрукты', 'Зерновые', 'Техника', 'Удобрения', 'Животные', 'Молочные продукты', 'Мясо', 'Мед', 'Саженцы'];
  const locations = ['Чуйская обл.', 'Ошская обл.', 'Джалал-Абад', 'Иссык-Куль', 'Нарын', 'Талас', 'Баткен', 'Бишкек'];
  
  console.log("Starting seeding...");
  
  // Seed 150 products
  for (let i = 0; i < 150; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const price = Math.floor(Math.random() * 1000) + 10;
    
    const product = {
      name: `${category} ${['Премиум', 'Отборный', 'Свежий', 'Оптом', 'Эко'][Math.floor(Math.random() * 5)]} #${i + 1}`,
      price: `${price} сом/кг`,
      quantity: `${Math.floor(Math.random() * 1000) + 50} кг`,
      location: location,
      category: category,
      description: `Высококачественный продукт из региона ${location}. Свежий урожай, отличные вкусовые качества. Соответствует всем стандартам качества.`,
      rating: parseFloat((Math.random() * (5 - 3) + 3).toFixed(1)),
      image: `https://picsum.photos/seed/prod${Date.now() + i}/800/600`,
      sellerId: user.uid,
      seller: {
        name: user.displayName || 'Фермер',
        avatar: user.photoURL || 'https://picsum.photos/seed/farmer/150/150',
        rating: 4.9
      },
      createdAt: serverTimestamp()
    };
    
    try {
      await addDoc(collection(db, 'products'), product);
    } catch (e) {
      console.error("Error seeding product:", e);
    }
  }
  
  const serviceCategories = ['Тракторы', 'Уборка', 'Посев', 'Консультации', 'Логистика', 'Аренда склада', 'Ветеринар', 'Агроном'];
  for (let i = 0; i < 100; i++) {
    const category = serviceCategories[Math.floor(Math.random() * serviceCategories.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const price = Math.floor(Math.random() * 5000) + 500;
    
    const service = {
      name: `${category} сервис ${['Профи', 'Эксперт', 'Быстро', 'Надежно'][Math.floor(Math.random() * 4)]} #${i + 1}`,
      price: `${price} сом/час`,
      location: location,
      category: category,
      description: `Профессиональные услуги по направлению ${category}. Опытные специалисты, современное оборудование. Гарантия качества и соблюдение сроков.`,
      rating: parseFloat((Math.random() * (5 - 4) + 4).toFixed(1)),
      image: `https://picsum.photos/seed/serv${Date.now() + i}/800/600`,
      providerId: user.uid,
      providerName: user.displayName || 'АгроСервис',
      providerAvatar: user.photoURL || 'https://picsum.photos/seed/provider/150/150',
      createdAt: serverTimestamp()
    };
    
    try {
      await addDoc(collection(db, 'services'), service);
    } catch (e) {
      console.error("Error seeding service:", e);
    }
  }

  // Seed transactions
  const transCategories = ['Продажа товара', 'Покупка семян', 'Аренда техники', 'Услуги агронома', 'Логистика', 'Удобрения'];
  for (let i = 0; i < 20; i++) {
    const type = Math.random() > 0.4 ? 'income' : 'expense';
    const amount = Math.floor(Math.random() * 15000) + 500;
    const category = transCategories[Math.floor(Math.random() * transCategories.length)];
    
    const transaction = {
      userId: user.uid,
      amount,
      type,
      category,
      description: `${category} - транзакция #${i + 1}`,
      createdAt: serverTimestamp()
    };
    
    try {
      await addDoc(collection(db, 'transactions'), transaction);
    } catch (e) {
      console.error("Error seeding transaction:", e);
    }
  }

  // Seed posts
  const postContents = [
    'Сегодня отличная погода для посева! Начинаем работу.',
    'Кто знает, где лучше купить семена картофеля?',
    'Наш урожай в этом году просто отличный!',
    'Новые технологии в сельском хозяйстве - это будущее.',
    'Ищем партнеров для экспорта яблок.'
  ];
  
  for (let i = 0; i < 30; i++) {
    const content = postContents[Math.floor(Math.random() * postContents.length)];
    const post = {
      userId: user.uid,
      userName: user.displayName || 'Фермер',
      userAvatar: user.photoURL || 'https://picsum.photos/seed/user/150/150',
      content: `${content} #${i + 1}`,
      image: Math.random() > 0.5 ? `https://picsum.photos/seed/post${Date.now() + i}/800/600` : null,
      createdAt: serverTimestamp()
    };
    
    try {
      await addDoc(collection(db, 'posts'), post);
    } catch (e) {
      console.error("Error seeding post:", e);
    }
  }

  alert("База данных успешно заполнена!");
};

const UnifiedAICard = ({ onScanClick }: { onScanClick: () => void }) => {
  return (
    <div className="relative w-full overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Совет ИИ</h2>
        <div className="flex gap-2 text-[10px] font-medium text-slate-500">
          <span>+12%</span>
          <span>5%</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
          Полить: <span className="text-emerald-600 dark:text-emerald-400">через 45 мин</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Влажность 38%. 1.5л/м².
        </p>
      </div>

      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 transition-all"
      >
        Полить
      </motion.button>
    </div>
  );
};

const ListingCard: React.FC<{ listing: Listing | Product; onClick?: () => void }> = ({ listing, onClick }) => {
  const [count, setCount] = useState(1);
  const product = listing as Product;

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="min-w-[200px] w-[200px] bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col cursor-pointer"
    >
      <div className="relative h-32">
        <img 
          src={listing.image} 
          alt={listing.name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-1.5 rounded-full text-slate-300 dark:text-slate-600 shadow-sm">
          <Star size={14} className={listing.rating > 4 ? "text-yellow-500 fill-yellow-500" : ""} />
        </div>
        {product.badge && (
          <div className="absolute top-3 left-3 px-2 py-0.5 bg-brand-600 text-white text-[8px] font-black uppercase rounded-lg shadow-lg">
            {product.badge === 'new' ? 'Новое' : product.badge === 'popular' ? 'Хит' : 'Топ'}
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-1">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{listing.price} {listing.quantity ? `за ${listing.quantity}` : 'за 1 кг'}</span>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight mt-0.5 truncate">{listing.name}</h4>
        </div>
        
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-full p-1 gap-3">
            <button 
              onClick={(e) => { e.stopPropagation(); setCount(Math.max(0, count - 1)) }}
              className="w-8 h-8 flex items-center justify-center bg-brand-200/50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400 rounded-full"
            >
              <Minus size={16} />
            </button>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-4 text-center">{count}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); setCount(count + 1) }}
              className="w-8 h-8 flex items-center justify-center bg-brand-600 text-white rounded-full"
            >
              <Plus size={16} />
            </button>
          </div>
          <button className="w-10 h-10 flex items-center justify-center bg-brand-600 text-white rounded-full shadow-lg shadow-brand-100 dark:shadow-brand-900/20">
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};


const ActionButtons = ({ onMarketClick, onAIClick }: { onMarketClick: () => void; onAIClick: () => void }) => (
  <div className="px-6 flex items-center gap-4">
    <button 
      onClick={onMarketClick}
      className="flex-1 glass rounded-3xl py-4 flex items-center justify-center gap-3 text-slate-600 dark:text-slate-300 hover:bg-white/20 transition-all active:scale-95"
    >
      <ShoppingBag size={18} />
      <span className="text-xs font-black uppercase tracking-widest">Маркет</span>
    </button>
    <button 
      onClick={onAIClick}
      className="w-14 h-14 glass rounded-3xl flex items-center justify-center text-brand-600 hover:bg-white/20 transition-all active:scale-95"
    >
      <Sparkles size={20} />
    </button>
    <button className="w-14 h-14 glass rounded-3xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white/20 transition-all active:scale-95">
      <Bell size={20} />
    </button>
  </div>
);



const NewsSection = ({ onNewsClick }: { onNewsClick: (news: NewsItem) => void }) => (
  <section className="mt-8 px-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
        Новости <span className="text-emerald-600 dark:text-emerald-400">Агро</span>
      </h3>
      <button className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">Все</button>
    </div>
    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
      {MOCK_NEWS.map((news) => (
        <div 
          key={news.id} 
          onClick={() => onNewsClick(news)}
          className="min-w-[240px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer active:scale-95 transition-transform"
        >
          <img src={news.image} alt={news.title} className="w-full h-24 object-cover" referrerPolicy="no-referrer" />
          <div className="p-4">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase">{news.date}</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 line-clamp-2">{news.title}</h4>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const BlogSection = ({ onPostClick }: { onPostClick: (post: any) => void }) => (
  <section className="mt-8 px-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
        Блог <span className="text-emerald-600 dark:text-emerald-400">экспертов</span>
      </h3>
    </div>
    <div className="space-y-4">
      {[
        { 
          id: 'b1', 
          title: 'Как повысить урожайность зерновых', 
          author: 'Азамат Исаев', 
          views: '1.2k', 
          icon: BookOpen, 
          image: 'https://picsum.photos/seed/blog1/400/300',
          content: '...',
          date: '3 дня назад',
          reactions: [{ type: '🌱', count: 45 }, { type: '👍', count: 120 }],
          comments: []
        },
        { 
          id: 'b2', 
          title: 'Секреты хранения овощей зимой', 
          author: 'Мария Петрова', 
          views: '850', 
          icon: BookOpen, 
          image: 'https://picsum.photos/seed/blog2/400/300',
          content: '...',
          date: '5 дней назад',
          reactions: [{ type: '❄️', count: 32 }, { type: '📦', count: 67 }],
          comments: []
        },
      ].map((post, i) => (
        <div 
          key={i} 
          onClick={() => onPostClick(post)}
          className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl overflow-hidden flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{post.title}</h4>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{post.author}</span>
              <span className="text-xs text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{post.views} просмотров</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);


const ListingsSection = ({ onListingClick, showTitle = true }: { onListingClick: (id: string) => void, showTitle?: boolean }) => {
  const crops = [
    { id: '1', name: 'Пшеница', status: 'good', health: 98, moisture: 42, statusText: 'Стабильно', image: 'https://picsum.photos/seed/wheat/400/400' },
    { id: '2', name: 'Кукуруза', status: 'warning', health: 75, moisture: 32, statusText: 'Полив завтра', image: 'https://picsum.photos/seed/corn/400/400' },
    { id: '3', name: 'Томаты', status: 'critical', health: 45, moisture: 15, statusText: 'Нужна проверка', image: 'https://picsum.photos/seed/tomato/400/400' },
  ];

  return (
    <section className={cn(showTitle ? "mt-12 px-6" : "")}>
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Мои <span className="text-emerald-600 dark:text-emerald-400">Культуры</span>
          </h3>
          <button className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">Управление</button>
        </div>
      )}
      <div className={cn("flex gap-4 overflow-x-auto no-scrollbar", showTitle ? "pb-8" : "")}>
          {crops.map(crop => (
            <motion.div 
              key={crop.id}
              whileHover={{ y: -5 }}
              className={cn(
                "min-w-[260px] bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm",
                crop.status === 'good' ? "border-emerald-100" : crop.status === 'warning' ? "border-amber-100" : "border-red-100"
              )}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{crop.name}</h4>
                  <div className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                    crop.status === 'good' ? "bg-emerald-50 text-emerald-700" : crop.status === 'warning' ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                  )}>
                    {crop.status === 'good' ? 'Отлично' : crop.status === 'warning' ? 'Внимание' : 'Критично'}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Здоровье</span>
                    <span className="text-slate-900 dark:text-white font-bold">{crop.health}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={cn(
                      "h-full rounded-full transition-all duration-500",
                      crop.status === 'good' ? "bg-emerald-500" : crop.status === 'warning' ? "bg-amber-500" : "bg-red-500"
                    )} style={{ width: `${crop.health}%` }} />
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{crop.statusText}</p>
                </div>
              </div>
            </motion.div>
          ))}
      </div>
    </section>
  );
};

// --- Marketplace Components ---

const SearchBar = () => (
  <div className="px-6 mt-4">
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input 
        type="text" 
        placeholder="Поиск продуктов..." 
        className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 pl-11 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm dark:text-white dark:placeholder:text-slate-600"
      />
      <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 rounded-xl">
        <Filter size={18} />
      </button>
    </div>
  </div>
);

const SubcategoryChips = ({ selected, onSelect }: { selected: string; onSelect: (s: string) => void }) => (
  <div className="mt-3">
    <div className="flex overflow-x-auto px-6 gap-2 no-scrollbar pb-2">
      {['Все', 'Новинки', 'Популярные', 'Семена'].map((sub) => (
        <button
          key={sub}
          onClick={() => onSelect(sub)}
          className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selected === sub 
              ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {sub}
        </button>
      ))}
    </div>
  </div>
);

const ProductCard: React.FC<{ 
  product: Product; 
  onClick?: () => void; 
  onAddClick?: (e: React.MouseEvent) => void;
  viewMode?: 'grid' | 'list';
}> = ({ product, onClick, onAddClick, viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group flex gap-4 cursor-pointer"
      >
        <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          {product.badge && (
            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-brand-600 text-white text-[8px] font-black uppercase rounded-md shadow-sm">
              {product.badge === 'new' ? 'Новое' : product.badge === 'popular' ? 'Хит' : 'Топ'}
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex justify-between items-start gap-2">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{product.name}</h4>
              <span className="text-sm font-black text-brand-600 dark:text-brand-400 whitespace-nowrap">{product.price}</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">{product.quantity || '1 кг'} • {product.location}</p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-snug">
              {product.description}
            </p>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <Star size={10} className="text-yellow-500 fill-yellow-500" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{product.rating}</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (onAddClick) onAddClick(e);
              }}
              className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-90 transition-all"
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative cursor-pointer flex flex-col h-full"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 mb-3">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {product.badge && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-brand-600 text-white text-[9px] font-black uppercase rounded-lg shadow-sm">
            {product.badge === 'new' ? 'Новое' : product.badge === 'popular' ? 'Хит' : 'Топ'}
          </div>
        )}
        <button 
          className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Heart size={16} />
        </button>
      </div>
      <div className="px-1 flex-1 flex flex-col">
        <span className="text-sm font-black text-slate-900 dark:text-white block mb-0.5">{product.price}</span>
        <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-0.5 line-clamp-1">{product.name}</h4>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">{product.quantity || '1 кг'}</p>
        
        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-tight">
          {product.description}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star size={10} className="text-yellow-500 fill-yellow-500" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{product.rating}</span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onAddClick) onAddClick(e);
            }}
            className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-90 transition-all"
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const CATEGORIES_LIST = [
  { id: 'fruit', name: 'Фрукты', icon: Apple, color: 'bg-red-50 text-red-500' },
  { id: 'veg', name: 'Овощи', icon: ShoppingBag, color: 'bg-orange-50 text-orange-500' },
  { id: 'dairy', name: 'Молочные', icon: Milk, color: 'bg-blue-50 text-blue-600' },
  { id: 'meat', name: 'Мясо', icon: Beef, color: 'bg-red-50 text-red-600' },
  { id: 'seeds', name: 'Семена', icon: Sprout, color: 'bg-emerald-50 text-emerald-600' },
  { id: 'tech', name: 'Техника', icon: Truck, color: 'bg-slate-50 text-slate-600' },
];

const MarketHeader = ({ onSearch }: { onSearch?: (query: string) => void }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(query || '');
  };

  return (
    <div className="bg-white dark:bg-slate-950 pt-4 pb-6 px-6 transition-colors duration-500">
      {/* Search Bar */}
      <div className="relative z-10">
        <form onSubmit={handleSearch} className="relative flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск продуктов..." 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-brand-500/20 transition-all dark:text-white"
            />
          </div>
          <button type="button" className="w-12 h-12 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-600/20 active:scale-90 transition-transform">
            <Filter size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

const Header = ({ 
  title, 
  location, 
  showBack, 
  onBack, 
  onMessageClick, 
  onCartClick, 
  onAddClick, 
  isHome 
}: { 
  title: string, 
  location?: string, 
  showBack?: boolean, 
  onBack?: () => void,
  onMessageClick?: () => void,
  onCartClick?: () => void,
  onAddClick?: () => void,
  isHome?: boolean
}) => (
  <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 dark:border-slate-800">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-4">
        {showBack && (
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-900 dark:text-white" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h1>
          {location && <p className="text-xs text-slate-500 dark:text-slate-400">{location}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onMessageClick && (
          <button onClick={onMessageClick} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <MessageSquare size={20} className="text-slate-900 dark:text-white" />
          </button>
        )}
        {onCartClick && (
          <button onClick={onCartClick} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ShoppingCart size={20} className="text-slate-900 dark:text-white" />
          </button>
        )}
        {onAddClick && (
          <button onClick={onAddClick} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <PlusCircle size={20} className="text-slate-900 dark:text-white" />
          </button>
        )}
        <NotificationBell />
      </div>
    </div>
    {isHome && (
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-slate-900 dark:text-white">Бишкек</p>
          <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-1">
            <Sun size={16} className="text-emerald-500" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">28°C</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Droplets size={14} className="text-blue-500" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">42%</span>
        </div>
      </div>
    )}
  </div>
);

const SpecialOfferCarousel = () => (
  <div className="mt-[-60px] relative z-20">
    <div className="flex items-center justify-between px-6 mb-4">
      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">#СпециальноДляВас</h3>
      <button className="text-brand-600 dark:text-brand-400 text-xs font-bold hover:underline">Смотреть все</button>
    </div>
    <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-4">
      {[
        { id: 1, title: 'Спецпредложение', discount: 'До 40%', image: 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?auto=format&fit=crop&q=80&w=400', color: 'from-brand-600 to-brand-800' },
        { id: 2, title: 'Новый урожай', discount: 'До 25%', image: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=400', color: 'from-emerald-600 to-emerald-800' },
      ].map((offer) => (
        <div key={offer.id} className={`relative shrink-0 w-[85%] h-44 rounded-[2.5rem] overflow-hidden bg-gradient-to-br ${offer.color} p-6 flex items-center shadow-xl shadow-brand-500/20 dark:shadow-none`}>
          <div className="relative z-10 max-w-[60%]">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest mb-2 inline-block border border-white/10">Ограничено</span>
            <h4 className="text-white text-lg font-bold leading-tight mb-1">{offer.title}</h4>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-white/80 text-xs font-medium">Скидки</span>
              <span className="text-white text-3xl font-black">{(offer.discount || '').split(' ')[1] || (offer.discount || '')}</span>
            </div>
            <button className="px-6 py-2 bg-white text-brand-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform">
              Получить
            </button>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/2">
            <img 
              src={offer.image} 
              alt={offer.title} 
              className="w-full h-full object-cover mix-blend-overlay opacity-80"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Decorative elements */}
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        </div>
      ))}
    </div>
    {/* Carousel Dots */}
    <div className="flex justify-center gap-1.5 mt-2">
      <div className="w-5 h-1.5 bg-brand-600 rounded-full" />
      <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
      <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
    </div>
  </div>
);

const MarketCategories = ({ onCategoryClick }: { onCategoryClick: (cat: string) => void }) => (
  <div className="mt-10">
    <div className="flex items-center justify-between px-6 mb-6">
      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Категории</h3>
      <button 
        onClick={() => onCategoryClick('Весь каталог')}
        className="text-brand-600 dark:text-brand-400 text-xs font-bold hover:underline"
      >
        Смотреть все
      </button>
    </div>
    <div className="flex gap-4 overflow-x-auto no-scrollbar px-6">
      {CATEGORIES_LIST.map((cat) => (
        <div 
          key={cat.id} 
          onClick={() => onCategoryClick(cat.name)}
          className="flex flex-col items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className={`w-20 h-20 rounded-[2rem] ${(cat.color || '').split(' ')[0] || ''} dark:bg-slate-900 flex items-center justify-center ${(cat.color || '').split(' ')[1] || ''} shadow-xl shadow-slate-200/50 dark:shadow-none group-hover:scale-110 transition-transform border border-slate-50 dark:border-slate-800`}>
            <cat.icon size={32} strokeWidth={2.5} />
          </div>
          <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 text-center leading-tight uppercase tracking-wider">{cat.name}</span>
        </div>
      ))}
    </div>
  </div>
);

const PopularProductsSection = ({ onProductClick }: { onProductClick: (id: string) => void }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'slider'>('slider');
  const popularProducts = MOCK_PRODUCTS.filter(p => p.badge === 'popular' || p.rating >= 4.8);
  
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between px-6 mb-4">
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Популярные</h3>
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('slider')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${viewMode === 'slider' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-400'}`}
          >
            <ChevronRight size={14} />
            <span className="text-[10px] font-black uppercase tracking-wider">Слайд</span>
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-400'}`}
          >
            <LayoutGrid size={16} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-400'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>
      
      {viewMode === 'slider' ? (
        <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-4">
          {popularProducts.map((product) => (
            <div key={product.id} className="w-48 shrink-0">
              <ProductCard 
                product={product} 
                onClick={() => onProductClick(product.id)} 
                viewMode="grid"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={`px-6 pb-4 ${viewMode === 'grid' 
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          : "flex flex-col gap-4"
        }`}>
          {popularProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onClick={() => onProductClick(product.id)} 
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const NewProductsSection = ({ onProductClick }: { onProductClick: (id: string) => void }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const newProducts = MOCK_PRODUCTS.filter(p => p.badge === 'new' || p.id === 'm101' || p.id === 'm3' || p.id === 'm5');
  
  return (
    <div className="mt-8 px-6 pb-32">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Новинки</h3>
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-400'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-400'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>
      
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        : "flex flex-col gap-4"
      }>
        {newProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onClick={() => onProductClick(product.id)} 
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );
};

const CatalogView = ({ onCategoryClick, onProductClick, onSearch }: { onCategoryClick: (cat: string) => void; onProductClick: (id: string) => void; onSearch?: (q: string) => void }) => {
  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen transition-colors duration-500">
      <MarketHeader onSearch={onSearch} />
      
      <div className="mt-2">
        <MarketCategories onCategoryClick={onCategoryClick} />
      </div>

      <PopularProductsSection onProductClick={onProductClick} />
      
      <NewProductsSection onProductClick={onProductClick} />
    </div>
  );
};


const ProductListPage = ({ category, onBack, onProductClick, onAddClick, initialSearch = '' }: { category: string; onBack: () => void; onProductClick: (id: string) => void; onAddClick?: () => void; initialSearch?: string }) => {
  const [selectedSubcategory, setSelectedSubcategory] = useState('Все');
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(pList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });
    return unsubscribe;
  }, []);

  const filteredProducts = (products.length > 0 ? products : MOCK_PRODUCTS).filter(p => {
    const matchesCategory = category === 'Весь каталог' || category === 'Новинки' || p.category === category;
    const safeName = (p.name || '').toLowerCase();
    const safeDesc = (p.description || '').toLowerCase();
    const safeQuery = (searchQuery || '').toLowerCase();
    const matchesSearch = safeName.includes(safeQuery) || safeDesc.includes(safeQuery);
    const matchesSubcategory = selectedSubcategory === 'Все' || p.badge === (selectedSubcategory === 'Новинки' ? 'new' : selectedSubcategory === 'Популярные' ? 'popular' : '');
    
    return matchesCategory && matchesSearch && matchesSubcategory;
  });

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Загрузка товаров...</p>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="bg-white dark:bg-slate-900 pb-4">
        <div className="px-6 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{category}</h2>
          </div>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-400'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-400'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
        <div className="px-6 mt-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск продуктов..." 
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3.5 pl-11 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all dark:text-white"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 rounded-xl">
              <Filter size={18} />
            </button>
          </div>
        </div>
        <SubcategoryChips selected={selectedSubcategory} onSelect={setSelectedSubcategory} />
      </div>

      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {selectedSubcategory} <span className="text-slate-400 dark:text-slate-500 font-normal text-sm ml-1">({filteredProducts.length})</span>
          </h3>
          {onAddClick && (
            <button onClick={onAddClick} className="flex items-center gap-1 text-brand-600 dark:text-brand-400 text-xs font-bold">
              <Plus size={16} />
              <span>Добавить</span>
            </button>
          )}
        </div>
        
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          : "flex flex-col gap-4"
        }>
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onClick={() => onProductClick(product.id)} 
                viewMode={viewMode}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-slate-400">В этой категории пока нет товаров</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MarketplacePage = ({ onProductClick, onAddClick }: { onProductClick: (id: string) => void; onAddClick: () => void }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [initialSearch, setInitialSearch] = useState('');

  const handleSearch = (query: string) => {
    setInitialSearch(query || '');
    setSelectedCategory('Весь каталог');
  };

  if (selectedCategory) {
    return (
      <ProductListPage 
        category={selectedCategory} 
        onBack={() => {
          setSelectedCategory(null);
          setInitialSearch('');
        }} 
        onProductClick={onProductClick}
        onAddClick={onAddClick}
        initialSearch={initialSearch}
      />
    );
  }

  return (
    <div className="transition-colors duration-500">
      <CatalogView onCategoryClick={setSelectedCategory} onProductClick={onProductClick} onSearch={handleSearch} />
    </div>
  );
};

// --- Product Details Components ---

const ProductDetailsPage = ({ product, onChatClick }: { product: Product; onChatClick?: (seller: any) => void }) => (
  <div className="pb-32 bg-slate-50 dark:bg-slate-950 min-h-screen">
    {/* Large Product Image */}
    <div className="relative h-[400px] w-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-12">
      <img 
        src={product.image} 
        alt={product.name} 
        className="max-w-full max-h-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-700"
        referrerPolicy="no-referrer"
      />
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button className="p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full text-slate-600 dark:text-slate-400 shadow-lg border border-white/20 dark:border-slate-700">
          <Share2 size={20} />
        </button>
        <button className="p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full text-slate-600 dark:text-slate-400 shadow-lg border border-white/20 dark:border-slate-700">
          <Heart size={20} />
        </button>
      </div>
    </div>

    {/* Product Info */}
    <div className="px-6 -mt-12 relative z-10">
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg">В наличии</span>
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg">{product.category}</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{product.name}</h2>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-black text-slate-900 dark:text-white">{product.rating}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">(124 отзыва)</span>
              </div>
              <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{product.location}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-brand-600 dark:text-brand-400 leading-none">{product.price}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-2">{product.quantity}</p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <img 
                src={product.seller.avatar} 
                alt={product.seller.name} 
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-white dark:border-slate-900 shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center">
                <ShieldCheck size={12} className="text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-black text-slate-900 dark:text-white text-base">{product.seller.name}</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Официальный поставщик • 5 лет на рынке</p>
            </div>
            <div className="flex items-center gap-1">
              <Star size={12} className="text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-black text-slate-900 dark:text-white">{product.seller.rating}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <a 
              href={`tel:${product.seller.phone || '+996555123456'}`}
              className="flex flex-col items-center justify-center gap-2 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm active:scale-95 transition-transform group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Phone size={18} />
              </div>
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Позвонить</span>
            </a>
            <button 
              onClick={() => onChatClick && onChatClick(product.seller)}
              className="flex flex-col items-center justify-center gap-2 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm active:scale-95 transition-transform group"
            >
              <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                <MessageCircle size={18} />
              </div>
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Чат</span>
            </button>
            <button 
              className="flex flex-col items-center justify-center gap-2 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm active:scale-95 transition-transform group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-slate-600 group-hover:text-white transition-colors">
                <User size={18} />
              </div>
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Профиль</span>
            </button>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3">Описание товара</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
            {product.description}
          </p>
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Похожие товары</h3>
            <button className="text-brand-600 dark:text-brand-400 text-xs font-bold">Все</button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {SIMILAR_LISTINGS.map(item => (
              <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-3 shrink-0 w-44 border border-slate-100 dark:border-slate-800 group cursor-pointer">
                <div className="aspect-square bg-white dark:bg-slate-900 rounded-2xl p-2 mb-3 overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                </div>
                <h5 className="font-black text-slate-900 dark:text-white text-xs truncate mb-1">{item.name}</h5>
                <div className="flex items-center justify-between">
                  <span className="text-brand-600 dark:text-brand-400 font-black text-sm">{item.price}</span>
                  <button className="w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          <button className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-800 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            <ShoppingCart size={24} />
          </button>
          <button className="flex-1 bg-brand-600 text-white rounded-3xl font-black text-base uppercase tracking-widest shadow-2xl shadow-brand-200 dark:shadow-brand-900/40 active:scale-95 transition-transform flex items-center justify-center gap-3">
            <span>Купить сейчас</span>
            <div className="w-1 h-1 bg-white/30 rounded-full" />
            <span>{product.price}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
);

const AIAssistantPage = () => {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (text: string = inputValue) => {
    if (!text.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const { text: aiText, suggestions } = getAIResponse(text);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (input: string): { text: string; suggestions?: Message['suggestions'] } => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('болезнь') || lowerInput.includes('листья')) {
      return {
        text: 'Пожалуйста, загрузите фотографию пораженного растения. Я проанализирую её и помогу определить проблему.',
        suggestions: [
          { label: 'Как правильно фотографировать?', type: 'tip', value: 'Снимайте при дневном свете, чтобы были видны детали листа.' },
          { label: 'Каталог болезней', type: 'link', value: 'catalog_diseases' }
        ]
      };
    }
    if (lowerInput.includes('цена') || lowerInput.includes('сколько стоит')) {
      return {
        text: 'Цены на сельхозпродукцию сейчас стабильны. Картофель: 16-18 сом, Лук: 12-14 сом. В каком регионе вы находитесь?',
        suggestions: [
          { label: 'График цен за месяц', type: 'action', value: 'show_price_chart' },
          { label: 'Рынок: Бишкек', type: 'link', value: 'market_bishkek' }
        ]
      };
    }
    if (lowerInput.includes('покупател')) {
      return {
        text: 'Я нашел 5 активных закупщиков в вашем регионе, которые ищут картофель оптом. Хотите посмотреть их контакты?',
        suggestions: [
          { label: 'Показать контакты', type: 'action', value: 'show_buyers' },
          { label: 'Советы по переговорам', type: 'tip', value: 'Всегда уточняйте условия доставки и упаковки.' }
        ]
      };
    }
    return {
      text: 'Я готов помочь вам с любым вопросом по сельскому хозяйству. Вы можете спросить о ценах, болезнях растений или найти покупателей.',
      suggestions: [
        { label: 'Популярные вопросы', type: 'tip', value: 'Чаще всего спрашивают про цены на удобрения и борьбу с вредителями.' }
      ]
    };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50 dark:bg-slate-950">
      {/* AI Info Header */}
      <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI помощник</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Спросите про цены, болезни растений или найдите покупателей</p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-brand-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-none'
            }`}>
              {msg.text}
              
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Рекомендации:</p>
                  <div className="flex flex-col gap-2">
                    {msg.suggestions.map((s, i) => (
                      <button 
                        key={i}
                        className="text-left p-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-medium text-brand-700 dark:text-brand-400 flex items-center justify-between group hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:border-brand-200 dark:hover:border-brand-800 transition-all"
                      >
                        <span className="flex items-center gap-2">
                          {s.type === 'link' && <ShoppingBag size={12} />}
                          {s.type === 'tip' && <Sparkles size={12} />}
                          {s.type === 'action' && <ChevronRight size={12} />}
                          {s.label}
                        </span>
                        <ChevronRight size={12} className="text-slate-300 dark:text-slate-600 group-hover:text-brand-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className={`text-[10px] mt-2 ${msg.sender === 'user' ? 'text-brand-100' : 'text-slate-400 dark:text-slate-500'}`}>
                {msg.timestamp}
              </p>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl rounded-tl-none flex gap-1">
              <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar bg-slate-50 dark:bg-slate-950">
        {[
          { label: 'Определить болезнь', icon: Sparkles },
          { label: 'Узнать цену', icon: ShoppingBag },
          { label: 'Найти покупателя', icon: User },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => handleSendMessage(action.label)}
            className="whitespace-nowrap px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-brand-500 hover:text-brand-600 transition-colors flex items-center gap-2 shadow-sm"
          >
            <action.icon size={14} />
            {action.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl hover:bg-brand-50 dark:hover:bg-brand-950/30 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            <PlusCircle size={20} />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Введите сообщение..."
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-brand-500/20 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim()}
            className={`p-3 rounded-2xl transition-all ${
              inputValue.trim() 
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' 
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const FinanceSection = ({ userId }: { userId: string }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(transData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    return () => unsubscribe();
  }, [userId]);

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  
  const balance = income - expenses;

  const chartData = [
    { name: 'Доходы', value: income, color: '#10b981' },
    { name: 'Расходы', value: expenses, color: '#ef4444' }
  ];

  const finalChartData = chartData.length > 0 && (income > 0 || expenses > 0) 
    ? chartData 
    : [{ name: 'Пусто', value: 1, color: '#f1f5f9' }];

  if (loading && transactions.length === 0) {
    return (
      <div className="px-6 mt-10 animate-pulse">
        <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg mb-5" />
        <div className="h-48 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800" />
      </div>
    );
  }

  return (
    <div className="px-6 mt-10">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Финансы</h3>
        <button className="text-xs font-bold text-brand-600 uppercase tracking-widest">Детали</button>
      </div>
      
      <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
        <div className="flex flex-col items-center gap-10">
          {/* Circular Chart with Cutout */}
          <div className="relative w-56 h-56 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={finalChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  startAngle={90}
                  endAngle={450}
                >
                  {finalChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#f1f5f9'} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length && payload[0] && payload[0].payload) {
                      const data = payload[0].payload;
                      const name = payload[0].name || data.name || 'Unknown';
                      const value = payload[0].value || data.value || 0;
                      const color = payload[0].color || data.color || '#000';
                      
                      return (
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xl text-xs font-bold">
                          <p style={{ color }}>
                            {name}: {Number(value).toLocaleString()} сом
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Cutout Data */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Баланс</span>
              <span className={cn(
                "text-3xl font-black tracking-tighter",
                balance >= 0 ? "text-slate-900 dark:text-white" : "text-red-500"
              )}>
                {balance.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-400 mt-1">СОМ</span>
            </div>
          </div>

          {/* Legend / Data Rows - Moved Below Chart */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-5 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-[32px] border border-emerald-100/50 dark:border-emerald-900/20 transition-transform hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <ArrowUpRight size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-600/60 uppercase tracking-widest">Доходы</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{income.toLocaleString()} сом</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-emerald-600">+12%</p>
                <p className="text-[10px] text-slate-400">в этом месяце</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-red-50/50 dark:bg-red-950/10 rounded-[32px] border border-red-100/50 dark:border-red-900/20 transition-transform hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
                  <ArrowDownLeft size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-600/60 uppercase tracking-widest">Расходы</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{expenses.toLocaleString()} сом</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-red-600">-5%</p>
                <p className="text-[10px] text-slate-400">в этом месяце</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl group-hover:bg-brand-500/10 transition-colors" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
      </div>
    </div>
  );
};

const FeedPost: React.FC<{ post: Post; onProfileClick: (userId: string) => void }> = ({ post, onProfileClick }) => {
  const { currentUser } = useAuth();
  const { isFollowing, toggleFollow } = useFollows(currentUser?.uid, post.userId);
  const isCurrentUser = currentUser?.uid === post.userId;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => onProfileClick(post.userId)}>
            <img src={post.userAvatar} className="w-10 h-10 rounded-2xl object-cover" />
          </button>
          <div>
            <button onClick={() => onProfileClick(post.userId)}>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition-colors">{post.userName}</h4>
            </button>
            <p className="text-[10px] text-slate-400 font-bold">
              {post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleString() : 'Только что'}
            </p>
          </div>
        </div>
        {!isCurrentUser && currentUser && (
          <button 
            onClick={toggleFollow}
            className={cn(
              "px-3 py-1 text-[10px] font-bold rounded-full transition-all active:scale-95",
              isFollowing 
                ? "bg-slate-100 dark:bg-slate-800 text-slate-500" 
                : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
            )}
          >
            {isFollowing ? 'Подписан' : 'Подписаться'}
          </button>
        )}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      {post.image && (
        <img src={post.image} className="mt-4 w-full h-64 object-cover rounded-2xl shadow-sm" />
      )}
      <div className="flex items-center gap-6 mt-5 pt-4 border-t border-slate-50 dark:border-slate-800/50">
        <button className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-500 transition-colors">
          <Heart size={18} />
          <span className="text-xs font-bold">0</span>
        </button>
        <button className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-500 transition-colors">
          <MessageCircle size={18} />
          <span className="text-xs font-bold">0</span>
        </button>
        <button className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-500 transition-colors ml-auto">
          <Share2 size={18} />
        </button>
      </div>
    </motion.div>
  );
};

const FeedPage = ({ onProfileClick }: { onProfileClick: (userId: string) => void }) => {
  const { posts, loading } = usePosts();
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();

  const handleCreatePost = async () => {
    if (!currentUser || !newPostText.trim()) return;
    setIsSubmitting(true);
    try {
      const postData = {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Пользователь',
        userAvatar: currentUser.photoURL || 'https://picsum.photos/seed/user/150/150',
        content: newPostText,
        image: newPostImage || null,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'posts'), postData);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        postsCount: increment(1)
      });
      setNewPostText('');
      setNewPostImage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-24 px-6 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Лента</h2>
        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl">
          <Activity size={20} />
        </div>
      </div>

      {currentUser && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm mb-8">
          <textarea 
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            placeholder="Что нового?"
            className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white resize-none h-24"
          />
          {newPostImage && (
            <div className="mt-3 relative">
              <img src={newPostImage} className="w-full h-32 object-cover rounded-2xl" />
              <button 
                onClick={() => setNewPostImage('')}
                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="flex justify-between items-center mt-3">
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const url = window.prompt('Введите URL изображения:');
                  if (url) setNewPostImage(url);
                }}
                className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
              >
                <ImageIcon size={20} />
              </button>
            </div>
            <button 
              onClick={handleCreatePost}
              disabled={isSubmitting || !newPostText.trim()}
              className="px-6 py-2 bg-emerald-500 text-white rounded-full text-sm font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? '...' : 'Опубликовать'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map(post => (
            <FeedPost key={post.id} post={post} onProfileClick={onProfileClick} />
          ))}
        </div>
      )}
    </div>
  );
};
const ProfilePage = ({ user, onUpdateUser, theme, setTheme, onSellClick, isAuthenticated, onLoginClick }: { user: UserProfile; onUpdateUser: (u: UserProfile) => void; theme: Theme; setTheme: (t: Theme) => void; onSellClick: () => void; isAuthenticated: boolean; onLoginClick: () => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [activeTab, setActiveTab] = useState<'listings' | 'orders' | 'blog'>('listings');
  const { currentUser } = useAuth();
  const isCurrentUser = currentUser?.uid === user.id;
  const { isFollowing, toggleFollow } = useFollows(currentUser?.uid, user.id);
  const { posts, loading: postsLoading } = usePosts(user.id);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liveUser, setLiveUser] = useState<UserProfile>(user);

  useEffect(() => {
    if (!user.id) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.id), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setLiveUser({
          id: doc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          fullName: data.fullName || data.displayName || 'Пользователь',
          name: data.fullName || data.displayName || 'Пользователь',
          email: data.email || '',
          phone: data.phone || '',
          avatar: data.photoURL || data.avatar || 'https://picsum.photos/seed/user/150/150',
          role: data.role || 'user',
          location: data.location || 'Бишкек, Кыргызстан',
          bio: data.bio || '',
          followersCount: data.followersCount || 0,
          followingCount: data.followingCount || 0,
          listingsCount: data.listingsCount || 0,
          postsCount: data.postsCount || 0,
          soldCount: data.soldCount || 0,
          rating: data.rating || 0,
          verified: data.verified || false,
          joinedDate: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'Март 2024'
        });
      }
    });
    return () => unsubscribe();
  }, [user.id]);

  const handleSave = async () => {
    if (!currentUser) return;
    try {
      const fullName = `${editedUser.firstName} ${editedUser.lastName}`;
      await updateDoc(doc(db, 'users', currentUser.uid), {
        firstName: editedUser.firstName,
        lastName: editedUser.lastName,
        fullName: fullName,
        displayName: fullName,
        photoURL: editedUser.avatar,
        avatar: editedUser.avatar,
        location: editedUser.location,
        bio: editedUser.bio,
        phone: editedUser.phone,
        quickRegistration: false,
        registrationLevel: 'full',
        updatedAt: serverTimestamp()
      });
      onUpdateUser({ ...editedUser, fullName, name: fullName, quickRegistration: false, registrationLevel: 'full' });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users/' + currentUser.uid);
    }
  };

  const handleCreatePost = async () => {
    if (!currentUser || !newPostText.trim()) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Пользователь',
        userAvatar: currentUser.photoURL || 'https://picsum.photos/seed/user/150/150',
        content: newPostText,
        image: newPostImage || null,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'users', currentUser.uid), {
        postsCount: increment(1)
      });
      setNewPostText('');
      setNewPostImage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот пост?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          postsCount: increment(-1)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'posts/' + postId);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-6">
          <User size={40} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Вы не вошли в систему</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Войдите, чтобы управлять своим профилем, заказами и объявлениями.</p>
        <button 
          onClick={onLoginClick}
          className="w-full max-w-xs bg-brand-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-100 active:scale-95 transition-transform"
        >
          Войти или зарегистрироваться
        </button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="pb-24 px-6 pt-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Редактировать профиль</h2>
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img 
                src={editedUser.avatar} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-md bg-brand-50 object-cover"
              />
              <div className="absolute bottom-0 right-0 p-2 bg-brand-600 text-white rounded-full shadow-lg">
                <Camera size={16} />
              </div>
            </div>
            <div className="w-full">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Ссылка на аватар</label>
              <input 
                type="text" 
                value={editedUser.avatar}
                onChange={(e) => setEditedUser({ ...editedUser, avatar: e.target.value })}
                className="w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white" 
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Имя</label>
                <input 
                  type="text" 
                  value={editedUser.firstName}
                  onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value })}
                  className="w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Фамилия</label>
                <input 
                  type="text" 
                  value={editedUser.lastName}
                  onChange={(e) => setEditedUser({ ...editedUser, lastName: e.target.value })}
                  className="w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white" 
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Телефон</label>
              <input 
                type="tel" 
                value={editedUser.phone}
                onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                className="w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Био</label>
              <textarea 
                value={editedUser.bio}
                onChange={(e) => setEditedUser({ ...editedUser, bio: e.target.value })}
                className="w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white h-24 resize-none" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Локация</label>
              <input 
                type="text" 
                value={editedUser.location}
                onChange={(e) => setEditedUser({ ...editedUser, location: e.target.value })}
                className="w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white" 
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditing(false)}
              className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold active:scale-95 transition-transform"
            >
              Отмена
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-100 active:scale-95 transition-transform"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-white dark:bg-slate-950 min-h-screen">
      {/* Header Section */}
      <div className="px-6 pt-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={liveUser.avatar} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-[2.5rem] border-4 border-white dark:border-slate-900 shadow-xl bg-brand-50 object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm"></div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{liveUser.fullName}</h2>
                  {liveUser.verified && (
                    <div className="bg-brand-500 text-white p-0.5 rounded-full shadow-sm shadow-brand-500/20">
                      <Check size={12} strokeWidth={4} />
                    </div>
                  )}
                </div>
                {isCurrentUser ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-full transition-all active:scale-95 shadow-md shadow-emerald-500/20"
                  >
                    Изменить
                  </button>
                ) : (
                  <button 
                    onClick={toggleFollow}
                    className={cn(
                      "px-4 py-1.5 text-xs font-bold rounded-full transition-all active:scale-95 shadow-md",
                      isFollowing 
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-none" 
                        : "bg-emerald-500 text-white shadow-emerald-500/20"
                    )}
                  >
                    {isFollowing ? 'Подписан' : 'Подписаться'}
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-0.5">{liveUser.role}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin size={12} className="text-emerald-500" />
                  <span className="font-medium">{liveUser.location}</span>
                </div>
                {liveUser.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Phone size={12} className="text-emerald-500" />
                    <span className="font-medium">{liveUser.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Mail size={12} className="text-emerald-500" />
                  <span className="font-medium">{liveUser.email}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => logOut()}
              className="p-2.5 bg-slate-50 dark:bg-slate-900/50 text-slate-400 hover:text-red-500 rounded-2xl transition-colors"
              title="Выйти"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Quick Registration Prompt */}
        {isCurrentUser && liveUser.quickRegistration && (
          <div className="mx-6 mb-8 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 rounded-3xl flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center text-amber-600">
              <Sparkles size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-100">Заполните профиль полностью</h4>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Добавьте имя и фото, чтобы повысить доверие покупателей.</p>
            </div>
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-amber-500 text-white text-[10px] font-bold rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              Заполнить
            </button>
          </div>
        )}

        {liveUser.bio && (
          <p className="px-1 text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            {liveUser.bio}
          </p>
        )}

        {/* Horizontal Stats Section */}
        <div className="grid grid-cols-3 gap-2 py-6 border-y border-slate-50 dark:border-slate-900/50 mb-8">
          <div className="text-center">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{liveUser.listingsCount || 0}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Объявления</p>
          </div>
          <div className="text-center border-x border-slate-50 dark:border-slate-900/50">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{liveUser.soldCount || 0}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Продано</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star size={18} className="fill-amber-400 text-amber-400" />
              <p className="text-2xl font-black text-slate-900 dark:text-white">{liveUser.rating || 0}</p>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Рейтинг</p>
          </div>
          <div className="text-center pt-4">
            <p className="text-xl font-black text-slate-900 dark:text-white">{liveUser.followersCount || 0}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Подписчики</p>
          </div>
          <div className="text-center pt-4 border-x border-slate-50 dark:border-slate-900/50">
            <p className="text-xl font-black text-slate-900 dark:text-white">{liveUser.followingCount || 0}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Подписки</p>
          </div>
          <div className="text-center pt-4">
            <p className="text-xl font-black text-slate-900 dark:text-white">{liveUser.postsCount || 0}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Посты</p>
          </div>
        </div>
      </div>

      {/* Finance Section */}
      {isAuthenticated && liveUser.id && <FinanceSection userId={liveUser.id} />}

      {/* Activity Tabs */}
      <div className="px-6 mt-10">
        <div className="flex gap-6 border-b border-slate-100 dark:border-slate-800 mb-6 overflow-x-auto no-scrollbar">
          {[
            { id: 'listings', label: 'Объявления' },
            { id: 'orders', label: 'Заказы' },
            { id: 'blog', label: 'Блог' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap ${
                activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTabProfile" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTab === 'listings' && (
            <>
              {isCurrentUser && (
                <button 
                  onClick={onSellClick}
                  className="col-span-full py-5 bg-emerald-50/50 dark:bg-emerald-950/10 border-2 border-dashed border-emerald-200 dark:border-emerald-900/30 rounded-3xl flex items-center justify-center gap-3 text-emerald-600 font-bold mb-4 active:scale-95 transition-transform"
                >
                  <Plus size={22} />
                  <span>Добавить новое объявление</span>
                </button>
              )}
              {MOCK_LISTINGS.slice(0, 2).map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:border-emerald-100 transition-colors">
                  <img src={item.image} referrerPolicy="no-referrer" className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">{item.name}</h4>
                    <p className="text-emerald-600 font-black text-xs mt-1">{item.price}</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform" />
                </div>
              ))}
            </>
          )}
          
          {activeTab === 'orders' && (
            MOCK_ORDERS.map(order => (
              <div key={order.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <img src={order.image} referrerPolicy="no-referrer" className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{order.productName}</h4>
                    <span className="text-[10px] px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-full font-black uppercase tracking-tighter">
                      {order.status === 'delivered' ? 'Доставлено' : order.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-emerald-600 font-black text-xs">{order.price}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{order.date}</p>
                  </div>
                </div>
              </div>
            ))
          )}

          {activeTab === 'blog' && (
            <div className="col-span-full space-y-4">
              {isCurrentUser && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 mb-4">
                  <textarea 
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder="Напишите что-нибудь в блог..."
                    className="w-full bg-white dark:bg-slate-950 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white resize-none h-24"
                  />
                  {newPostImage && (
                    <div className="mt-3 relative">
                      <img src={newPostImage} className="w-full h-32 object-cover rounded-2xl" />
                      <button 
                        onClick={() => setNewPostImage('')}
                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-3">
                    <button 
                      onClick={() => {
                        const url = window.prompt('Введите URL изображения:');
                        if (url) setNewPostImage(url);
                      }}
                      className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                    >
                      <ImageIcon size={20} />
                    </button>
                    <button 
                      onClick={handleCreatePost}
                      disabled={isSubmitting || !newPostText.trim()}
                      className="px-6 py-2 bg-emerald-500 text-white rounded-full text-sm font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? '...' : 'Опубликовать'}
                    </button>
                  </div>
                </div>
              )}

              {postsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                </div>
              ) : posts.length > 0 ? (
                posts.map(post => (
                  <div key={post.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative group">
                    {isCurrentUser && (
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    {post.image && (
                      <img src={post.image} className="mt-4 w-full h-40 object-cover rounded-2xl" />
                    )}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                      <p className="text-[10px] text-slate-400 font-bold">
                        {post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Только что'}
                      </p>
                      <div className="flex gap-4">
                        <button className="text-slate-400 hover:text-emerald-500 transition-colors">
                          <Heart size={16} />
                        </button>
                        <button className="text-slate-400 hover:text-emerald-500 transition-colors">
                          <Share2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
                    <Newspaper size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">У пользователя пока нет записей в блоге</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Settings Section */}
      <div className="px-6 mt-12 pb-12">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Настройки</h3>
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {[
            { label: 'Настройки профиля', icon: User },
            { label: 'Упаковка и доставка', icon: Package },
            { label: 'Язык (Русский)', icon: Globe },
            { label: 'Уведомления', icon: Bell },
          ].map((item, i) => (
            <button key={i} className={`w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${i !== 3 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl">
                  <item.icon size={20} />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
            </button>
          ))}
          
          {/* Theme Selector */}
          <div className="px-6 py-6 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
            <div className="flex items-center gap-4 mb-5">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl">
                <Moon size={20} />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Тема оформления</span>
            </div>
            <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-3xl">
              {[
                { id: 'light', label: 'Светлая', icon: Sun },
                { id: 'dark', label: 'Темная', icon: Moon },
                { id: 'system', label: 'Системная', icon: Settings },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as Theme)}
                  className={`flex flex-col items-center justify-center gap-2 py-3 rounded-2xl transition-all ${
                    theme === t.id 
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-md' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <t.icon size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SellPage = () => {
  return (
    <div className="pb-24 px-6 pt-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Создать объявление</h2>
      
      <div className="space-y-6">
        {/* Photo Upload */}
        <div className="grid grid-cols-2 gap-4">
          <button className="aspect-square bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600 hover:border-brand-500 hover:text-brand-600 transition-colors">
            <Camera size={32} />
            <span className="text-xs font-bold">Камера</span>
          </button>
          <button className="aspect-square bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600 hover:border-brand-500 hover:text-brand-600 transition-colors">
            <ImageIcon size={32} />
            <span className="text-xs font-bold">Галерея</span>
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Название товара</label>
            <input type="text" placeholder="Например: Картофель Алладин" className="w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Цена (сом/кг)</label>
              <input type="number" placeholder="0" className="w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Вес (кг/тонн)</label>
              <input type="text" placeholder="Напр: 500 кг" className="w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Описание</label>
            <textarea rows={4} placeholder="Опишите ваш товар..." className="w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-brand-500/20 resize-none text-slate-900 dark:text-white"></textarea>
          </div>
        </div>

        <button className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-100 dark:shadow-brand-900/20 active:scale-95 transition-transform">
          Опубликовать
        </button>
      </div>
    </div>
  );
};

const AIPhotoReport = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState<'upload' | 'scanning' | 'report'>('upload');

  const handleStartScan = () => {
    setStep('scanning');
    setTimeout(() => {
      setStep('report');
    }, 3000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-md md:max-w-xl lg:max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 max-h-[90vh] overflow-y-auto no-scrollbar">
        {step === 'upload' && (
          <div className="p-10">
            <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Scan size={48} className="animate-pulse" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white text-center mb-4 tracking-tight">AI Crop Scan</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-10 leading-relaxed font-medium">
              Загрузите фото вашего урожая для мгновенного анализа болезней, стадии роста и рекомендаций.
            </p>
            
            <div className="space-y-4">
              <button 
                onClick={handleStartScan}
                className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
              >
                <Camera size={22} /> Сделать фото
              </button>
              <button 
                onClick={handleStartScan}
                className="w-full py-5 bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all text-sm uppercase tracking-widest border border-slate-200 dark:border-white/5"
              >
                <ImageIcon size={22} /> Из галереи
              </button>
              <button 
                onClick={onClose}
                className="w-full py-4 text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {step === 'scanning' && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="relative w-40 h-40 mb-10">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 border-4 border-emerald-500/40 border-t-emerald-500 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={48} className="text-emerald-500 animate-bounce" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tighter">Анализируем...</h3>
            <p className="text-slate-500 dark:text-white/60 text-sm font-medium animate-pulse uppercase tracking-widest">Ищем признаки болезней и стадии роста</p>
          </div>
        )}

        {step === 'report' && (
          <div className="p-0">
            {/* Report Header */}
            <div className="bg-emerald-600 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                    <FileText size={24} />
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <h3 className="text-3xl font-black tracking-tighter mb-1">Отчет AI</h3>
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest">ID: #AI-88291</p>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Summary Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/5">
                  <span className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest block mb-2">Культура</span>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Томат (Сорт: Аврора)</p>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/5">
                  <span className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest block mb-2">Стадия роста</span>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Цветение (75%)</p>
                </div>
              </div>

              {/* Health Status */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/60">Состояние здоровья</h4>
                  <span className="px-3 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-full uppercase tracking-widest">Внимание</span>
                </div>
                <div className="bg-amber-50 dark:bg-amber-500/10 p-5 rounded-3xl border border-amber-100 dark:border-amber-500/20">
                  <div className="flex gap-4">
                    <div className="p-3 bg-amber-500 text-white rounded-2xl h-fit">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-amber-900 dark:text-amber-400 mb-1">Обнаружен Фитофтороз</h5>
                      <p className="text-xs font-medium text-amber-800/70 dark:text-amber-400/70 leading-relaxed">
                        На нижних листьях обнаружены темные пятна. Рекомендуется немедленная обработка.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/60">Рекомендации AI</h4>
                <div className="space-y-3">
                  {[
                    { icon: Droplets, text: 'Уменьшить полив на 20% до обработки', color: 'text-blue-500' },
                    { icon: Sparkles, text: 'Обработать фунгицидом "Квадрис"', color: 'text-emerald-500' },
                    { icon: Sun, text: 'Удалить пораженные листья вручную', color: 'text-amber-500' },
                  ].map((rec, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                      <rec.icon size={18} className={rec.color} />
                      <p className="text-xs font-bold text-slate-700 dark:text-white/80">{rec.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Понятно
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ReviewsSection = () => {
  const reviews = [
    { id: 1, name: 'Ольга', location: 'г. Люберцы', rating: 5, text: 'Прекрасный сервис и качественные продукты. Молочка и мясо на высоте. Цены на многие продукты ниже чем в магазинах.' },
    { id: 2, name: 'Иван', location: 'г. Бишкек', rating: 5, text: 'Очень удобно заказывать свежие овощи прямо с грядки. Доставка быстрая, все приехало в лучшем виде.' },
  ];

  return (
    <div className="mt-12 px-6">
      <div className="text-center mb-6 relative">
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          <div className="w-48 h-12 bg-brand-50/50 dark:bg-brand-950/20 rounded-full blur-xl"></div>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
          Отзывы <span className="text-brand-600 dark:text-brand-400">покупателей</span>
        </h3>
      </div>
      
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
        {reviews.map((review) => (
          <div key={review.id} className="min-w-[280px] bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">{review.name}</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">{review.location}</p>
              </div>
              <div className="flex gap-0.5">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
              "{review.text}"
            </p>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-100 dark:shadow-brand-900/20 active:scale-95 transition-transform">
        Все отзывы
      </button>
    </div>
  );
};

const FAQSection = () => {
  const faqs = [
    { q: 'Что такое EGIN?', a: 'EGIN — это маркетплейс для фермеров и покупателей.' },
    { q: 'Условия доставки', a: 'Доставка осуществляется курьером или самовывозом.' },
    { q: 'Как мы работаем?', a: 'Мы соединяем фермеров напрямую с покупателями.' },
    { q: 'Сборка заказа', a: 'Ваш заказ собирается фермером в день доставки.' },
    { q: 'Способы оплаты', a: 'Оплата картой или наличными при получении.' },
    { q: 'Процесс оплаты', a: 'Безопасная оплата через наше приложение.' },
  ];

  return (
    <div className="mt-12 px-6 pb-12">
      <div className="text-center mb-8 relative">
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          <div className="w-48 h-12 bg-brand-50/50 dark:bg-brand-950/20 rounded-full blur-xl"></div>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
          Вопросы и <span className="text-brand-600 dark:text-brand-400">ответы</span>
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group cursor-pointer hover:border-brand-200 dark:hover:border-brand-800 transition-colors">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight pr-2">{faq.q}</span>
            <ChevronDown size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-brand-600 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
};

const NewsDetailsPage = ({ news }: { news: NewsItem }) => {
  const [comment, setComment] = useState('');
  const [reactions, setReactions] = useState(news.reactions);

  const handleAddReaction = (type: string) => {
    setReactions(prev => prev.map(r => r.type === type ? { ...r, count: r.count + 1 } : r));
  };

  return (
    <div className="pb-24 bg-white dark:bg-slate-950 min-h-screen">
      <img src={news.image} alt={news.title} className="w-full h-64 object-cover" referrerPolicy="no-referrer" />
      <div className="px-6 -mt-8 relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-xl border border-slate-50 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {news.date}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{news.author}</span>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-6">{news.title}</h2>
          
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {(news.content || '').split('\n\n').map((para, i) => (
              <p key={i} className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">{para}</p>
            ))}
          </div>

          {/* Reactions */}
          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Реакции</h4>
            <div className="flex flex-wrap gap-2">
              {reactions.map((r, i) => (
                <button 
                  key={i}
                  onClick={() => handleAddReaction(r.type)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-2xl flex items-center gap-2 transition-colors border border-slate-100 dark:border-slate-700"
                >
                  <span className="text-lg">{r.type}</span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{r.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Комментарии ({news.comments.length})</h4>
            
            <div className="space-y-6 mb-8">
              {news.comments.map((c) => (
                <div key={c.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{c.user}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{c.date}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative">
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Оставьте ваш комментарий..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl py-4 px-5 text-sm focus:ring-2 focus:ring-brand-500/20 resize-none text-slate-900 dark:text-white"
                rows={3}
              />
              <button 
                disabled={!comment.trim()}
                className="absolute right-3 bottom-3 p-2 bg-brand-600 text-white rounded-2xl disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-all"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CommunitiesPage = ({ onCategoryClick }: { onCategoryClick: (cat: CommunityCategory) => void }) => {
  return (
    <div className="pb-24 px-6 pt-6">
      <div className="bg-brand-900 rounded-[40px] p-8 text-white mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Сообщества</h2>
          <p className="text-brand-200 text-sm opacity-80">Общайтесь, делитесь опытом и находите единомышленников в агро-сфере.</p>
        </div>
        <Users className="absolute -bottom-6 -right-6 text-brand-800 opacity-20" size={160} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_COMMUNITIES.map((cat) => (
          <button 
            key={cat.id}
            onClick={() => onCategoryClick(cat)}
            className="flex items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:border-brand-200 dark:hover:border-brand-800 transition-all group"
          >
            <div className="w-14 h-14 bg-brand-50 dark:bg-brand-950/30 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
              <cat.icon size={28} />
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-bold text-slate-900 dark:text-white">{cat.name}</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{cat.chats.length} активных чатов</p>
            </div>
            <ChevronRight size={20} className="text-slate-300 dark:text-slate-600" />
          </button>
        ))}
      </div>
    </div>
  );
};

const ChatListPage = ({ category, onChatClick }: { category: CommunityCategory; onChatClick: (chat: CommunityChat) => void }) => {
  return (
    <div className="pb-24 px-6 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-brand-50 dark:bg-brand-950/30 rounded-xl flex items-center justify-center text-brand-600 dark:text-brand-400">
          <category.icon size={20} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{category.name}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {category.chats.map((chat) => (
          <button 
            key={chat.id}
            onClick={() => onChatClick(chat)}
            className="w-full flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-brand-100 dark:hover:border-brand-900 transition-all"
          >
            <img src={chat.image} alt={chat.name} className="w-14 h-14 rounded-2xl object-cover shrink-0" referrerPolicy="no-referrer" />
            <div className="flex-1 text-left min-w-0">
              <h4 className="font-bold text-slate-900 dark:text-white truncate">{chat.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{chat.lastMessage}</p>
              <div className="flex items-center gap-2 mt-2">
                <Users size={12} className="text-slate-300 dark:text-slate-600" />
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{chat.members} участников</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
          </button>
        ))}
      </div>
    </div>
  );
};

const ChatRoomPage = ({ chat }: { chat: CommunityChat }) => {
  const [messages, setMessages] = useState([
    { id: '1', user: 'Алексей', text: 'Всем привет! Кто уже начал посевную?', time: '10:00', isMe: false },
    { id: '2', user: 'Мария', text: 'Мы в Чуйской области уже начали картофель сажать.', time: '10:05', isMe: false },
    { id: '3', user: 'Вы', text: 'А какой сорт используете?', time: '10:10', isMe: true },
    { id: '4', user: 'Мария', text: 'В основном Алладин и Розара.', time: '10:12', isMe: false },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, {
      id: Date.now().toString(),
      user: 'Вы',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    }]);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-slate-50 dark:bg-slate-950">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
            {!msg.isMe && <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 ml-2">{msg.user}</span>}
            <div className={`max-w-[80%] p-4 rounded-3xl text-sm ${
              msg.isMe 
                ? 'bg-brand-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-800'
            }`}>
              {msg.text}
              <div className={`text-[10px] mt-1 ${msg.isMe ? 'text-brand-200' : 'text-slate-300 dark:text-slate-600'} text-right`}>
                {msg.time}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button className="p-3 text-slate-400 dark:text-slate-500 hover:text-brand-600 transition-colors">
            <PlusCircle size={24} />
          </button>
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Напишите сообщение..."
            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white"
          />
          <button 
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="p-3 bg-brand-600 text-white rounded-2xl disabled:opacity-50 transition-all"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ChatFAB = () => null;

const BottomNav = ({ activeTab, onTabChange, isAdmin }: { activeTab: View; onTabChange: (t: View) => void; isAdmin?: boolean }) => {
  const tabs = [
    { id: 'home', label: 'Главная', icon: Home },
    { id: 'market', label: 'Рынок', icon: ShoppingBag },
    { id: 'ai', label: 'ИИ помощник', icon: Sparkles },
    { id: 'communities', label: 'Сообщества', icon: Users },
    { id: 'settings', label: 'Профиль', icon: User },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', label: 'Админ', icon: Shield });
  }

  return (
    <nav className="fixed bottom-4 left-0 right-0 h-14 glass flex justify-between items-center px-6 z-50 md:max-w-2xl lg:max-w-4xl xl:max-w-6xl md:mx-auto md:rounded-full shadow-lg border border-white/5">
      {tabs.map((item) => (
        <button 
          key={item.id}
          onClick={() => onTabChange(item.id as View)}
          className="relative flex flex-col items-center group"
        >
          {activeTab === item.id && (
            <motion.div 
              layoutId="nav-glow"
              className="absolute -inset-2 bg-emerald-500/10 blur-lg rounded-full"
            />
          )}
          <item.icon 
            size={22} 
            className={cn(
              "transition-all duration-300",
              activeTab === item.id ? "text-emerald-500 scale-110" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
            )} 
          />
          <span className={cn(
            "text-[8px] font-black uppercase tracking-widest mt-1.5 transition-all duration-300",
            activeTab === item.id ? "text-emerald-500 opacity-100" : "text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100"
          )}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

const clearDatabase = async () => {
  if (!auth.currentUser) return;
  if (!window.confirm("Вы уверены, что хотите удалить ВСЕ товары и услуги? Это действие необратимо.")) return;

  try {
    const pSnap = await getDocs(collection(db, 'products'));
    const sSnap = await getDocs(collection(db, 'services'));
    
    const deletePromises = [
      ...pSnap.docs.map(d => deleteDoc(doc(db, 'products', d.id))),
      ...sSnap.docs.map(d => deleteDoc(doc(db, 'services', d.id)))
    ];
    
    await Promise.all(deletePromises);
    alert("База данных очищена!");
  } catch (e) {
    console.error("Error clearing database:", e);
    alert("Ошибка при очистке базы данных.");
  }
};

const AdminPanel = ({ onSeed, onClear, onUserClick }: { onSeed: () => void; onClear: () => void; onUserClick: (u: UserProfile) => void }) => {
  const [stats, setStats] = useState({ products: 0, services: 0, users: 0 });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'dashboard' | 'users'>('dashboard');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const pSnap = await getDocs(collection(db, 'products'));
        const sSnap = await getDocs(collection(db, 'services'));
        const uSnap = await getDocs(collection(db, 'users'));
        setStats({
          products: pSnap.size,
          services: sSnap.size,
          users: uSnap.size
        });
        
        const usersList = uSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        setUsers(usersList);
      } catch (e) {
        console.error("Error fetching stats:", e);
      }
    };
    fetchStats();
    
    // Set up real-time listeners for stats
    const unsubP = onSnapshot(collection(db, 'products'), (s) => setStats(prev => ({ ...prev, products: s.size })));
    const unsubS = onSnapshot(collection(db, 'services'), (s) => setStats(prev => ({ ...prev, services: s.size })));
    const unsubU = onSnapshot(collection(db, 'users'), (s) => {
      setStats(prev => ({ ...prev, users: s.size }));
      const usersList = s.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      setUsers(usersList);
    });
    
    return () => {
      unsubP();
      unsubS();
      unsubU();
    };
  }, []);

  const filteredUsers = users.filter(u => 
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateUser = async (u: UserProfile) => {
    if (!u.id) return;
    try {
      const fullName = `${u.firstName} ${u.lastName}`;
      await updateDoc(doc(db, 'users', u.id), {
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: fullName,
        displayName: fullName,
        email: u.email,
        phone: u.phone,
        location: u.location,
        bio: u.bio,
        verified: u.verified,
        registrationLevel: u.registrationLevel || 'full',
        followersCount: u.followersCount || 0,
        followingCount: u.followingCount || 0,
        postsCount: u.postsCount || 0,
        updatedAt: serverTimestamp()
      });
      setEditingUser(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users/' + u.id);
    }
  };

  if (editingUser) {
    return (
      <div className="pb-24 px-6 pt-6">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setEditingUser(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Редактировать пользователя</h2>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-4">
            <img src={editingUser.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover" />
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">{editingUser.fullName}</h4>
              <p className="text-xs text-slate-400">{editingUser.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Имя</label>
                <input 
                  type="text" 
                  value={editingUser.firstName}
                  onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl py-3 px-4 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Фамилия</label>
                <input 
                  type="text" 
                  value={editingUser.lastName}
                  onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl py-3 px-4 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <input 
                type="email" 
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl py-3 px-4 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Телефон</label>
              <input 
                type="tel" 
                value={editingUser.phone}
                onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl py-3 px-4 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Локация</label>
              <input 
                type="text" 
                value={editingUser.location}
                onChange={(e) => setEditingUser({ ...editingUser, location: e.target.value })}
                className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl py-3 px-4 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Био</label>
              <textarea 
                value={editingUser.bio}
                onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl py-3 px-4 text-sm h-24 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Уровень регистрации</label>
                <select 
                  value={editingUser.registrationLevel || 'full'}
                  onChange={(e) => setEditingUser({ ...editingUser, registrationLevel: e.target.value as any })}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl py-3 px-4 text-sm text-slate-900 dark:text-white"
                >
                  <option value="quick">Быстрая</option>
                  <option value="full">Полная</option>
                  <option value="social">Социальная</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Провайдер</label>
                <input 
                  type="text" 
                  value={editingUser.provider || 'email'}
                  readOnly
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl py-3 px-4 text-sm text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Подписчики</label>
                <input 
                  type="number" 
                  value={editingUser.followersCount || 0}
                  onChange={(e) => setEditingUser({ ...editingUser, followersCount: parseInt(e.target.value) || 0 })}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl py-3 px-4 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Подписки</label>
                <input 
                  type="number" 
                  value={editingUser.followingCount || 0}
                  onChange={(e) => setEditingUser({ ...editingUser, followingCount: parseInt(e.target.value) || 0 })}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl py-3 px-4 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Посты</label>
                <input 
                  type="number" 
                  value={editingUser.postsCount || 0}
                  onChange={(e) => setEditingUser({ ...editingUser, postsCount: parseInt(e.target.value) || 0 })}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl py-3 px-4 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl">
              <div>
                <h5 className="font-bold text-slate-900 dark:text-white text-sm">Верификация</h5>
                <p className="text-[10px] text-slate-400">Синяя галочка в профиле</p>
              </div>
              <button 
                onClick={() => setEditingUser({ ...editingUser, verified: !editingUser.verified })}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  editingUser.verified ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-700"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  editingUser.verified ? "left-7" : "left-1"
                )} />
              </button>
            </div>
          </div>

          <button 
            onClick={() => handleUpdateUser(editingUser)}
            className="w-full bg-brand-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-100 active:scale-95 transition-transform"
          >
            Сохранить изменения
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 px-6 pt-6">
      <div className="bg-slate-900 rounded-[40px] p-8 text-white mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Админ Панель</h2>
          <p className="text-slate-400 text-sm">Управление контентом и пользователями сайта.</p>
        </div>
        <Shield className="absolute -bottom-6 -right-6 text-slate-800 opacity-20" size={160} />
      </div>

      <div className="flex gap-2 mb-8 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl">
        <button 
          onClick={() => setView('dashboard')}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
            view === 'dashboard' ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
          )}
        >
          Дашборд
        </button>
        <button 
          onClick={() => setView('users')}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
            view === 'users' ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
          )}
        >
          Пользователи
        </button>
      </div>

      {view === 'dashboard' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="w-12 h-12 bg-brand-50 dark:bg-brand-950/30 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
                <LayoutGrid size={24} />
              </div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">{stats.products}</h4>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Товаров</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                <Activity size={24} />
              </div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">{stats.services}</h4>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Услуг</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <Users size={24} />
              </div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">{stats.users}</h4>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Пользователей</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Быстрые действия</h3>
            <button 
              onClick={onSeed}
              className="w-full flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-brand-100 transition-all"
            >
              <div className="w-12 h-12 bg-brand-50 dark:bg-brand-950/30 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400">
                <Database size={24} />
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-bold text-slate-900 dark:text-white">Заполнить базу данных</h4>
                <p className="text-xs text-slate-400">Добавить 150 тестовых товаров и услуг.</p>
              </div>
              <ChevronRight size={20} className="text-slate-300" />
            </button>

            <button 
              onClick={onClear}
              className="w-full flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-brand-100 transition-all"
            >
              <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400">
                <X size={24} />
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-bold text-slate-900 dark:text-white">Очистить базу (DEV)</h4>
                <p className="text-xs text-slate-400">Удалить все товары и услуги.</p>
              </div>
              <ChevronRight size={20} className="text-slate-300" />
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Поиск пользователей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
            />
          </div>

          <div className="space-y-3">
            {filteredUsers.map(u => (
              <div key={u.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <img 
                  src={u.avatar} 
                  alt="" 
                  className="w-12 h-12 rounded-2xl object-cover bg-slate-100"
                  onClick={() => onUserClick(u)}
                />
                <div className="flex-1 min-w-0" onClick={() => onUserClick(u)}>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{u.fullName}</h4>
                    {u.verified && (
                      <div className="bg-brand-500 text-white p-0.5 rounded-full">
                        <Check size={8} strokeWidth={4} />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                </div>
                <button 
                  onClick={() => setEditingUser(u)}
                  className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl hover:text-brand-600 transition-colors"
                >
                  <Edit3 size={18} />
                </button>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={48} />
                <p className="text-slate-400 font-medium">Пользователи не найдены</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App ---

const LoginPage = ({ onBack }: { onBack?: () => void }) => {
  const [regType, setRegType] = useState<'login' | 'quick' | 'full'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Бишкек, Кыргызстан');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickRegResult, setQuickRegResult] = useState<{username: string, password: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (regType === 'full' && password !== confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    try {
      if (regType === 'quick') {
        const isEmail = email.includes('@');
        const { userCredential, email: regEmail, password: regPassword, username, fullName, phone: regPhone } = 
          await quickRegister(email || phone, isEmail ? 'email' : 'phone');
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: regEmail,
          fullName,
          username,
          phone: regPhone,
          avatar: 'https://picsum.photos/seed/user/150/150',
          role: 'user',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          listingsCount: 0,
          soldCount: 0,
          rating: 0,
          verified: false,
          quickRegistration: true,
          registrationLevel: 'quick',
          provider: isEmail ? 'email' : 'phone',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        setQuickRegResult({ username, password: regPassword });
        setLoading(false);
        return;
      } else if (regType === 'full') {
        const { userCredential, firstName: regFirst, lastName: regLast, fullName, phone: regPhone, location: regLocation, bio: regBio } = 
          await registerWithEmail(email, password, firstName, lastName, phone, location, bio);
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email,
          firstName: regFirst,
          lastName: regLast,
          fullName,
          phone: regPhone,
          location: regLocation,
          bio: regBio,
          avatar: 'https://picsum.photos/seed/user/150/150',
          role: email === 'nterra558@gmail.com' ? 'admin' : 'user',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          listingsCount: 0,
          soldCount: 0,
          rating: 0,
          verified: false,
          quickRegistration: false,
          registrationLevel: 'full',
          provider: 'email',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        await loginWithEmail(email, password);
      }
      if (onBack) onBack();
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setLoading(true);
    setError(null);
    try {
      let result;
      switch(provider) {
        case 'google': result = await signInWithGoogle(); break;
        case 'yandex': result = await signInWithYandex(); break;
        case 'vk': result = await signInWithVK(); break;
        case 'linkedin': result = await signInWithLinkedIn(); break;
        case 'instagram': result = await signInWithInstagram(); break;
        default: throw new Error("Провайдер не поддерживается");
      }
      
      if (result?.user) {
        // Update profile if social login
        const userRef = doc(db, 'users', result.user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: result.user.uid,
            email: result.user.email,
            fullName: result.user.displayName || 'Пользователь',
            avatar: result.user.photoURL || 'https://picsum.photos/seed/user/150/150',
            role: 'user',
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            listingsCount: 0,
            soldCount: 0,
            rating: 0,
            verified: false,
            quickRegistration: false,
            registrationLevel: 'social',
            provider: provider,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } else {
          await updateDoc(userRef, {
            updatedAt: serverTimestamp(),
            provider: provider
          });
        }
      }
      if (onBack) onBack();
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (quickRegResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-8 text-center bg-slate-50 dark:bg-slate-950 py-12">
        <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/20">
          <Check size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
          Регистрация успешна!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium text-sm">
          Сохраните эти данные для входа в будущем.
        </p>
        
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 space-y-4 mb-8">
          <div className="text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Логин / Email</label>
            <div className="flex items-center justify-between mt-1 bg-slate-50 dark:bg-slate-950 rounded-2xl py-3 px-4">
              <span className="text-sm font-bold text-slate-900 dark:text-white">{quickRegResult.username}</span>
              <button onClick={() => {
                navigator.clipboard.writeText(quickRegResult.username);
                alert("Логин скопирован!");
              }} className="text-brand-600 text-xs font-bold">Копировать</button>
            </div>
          </div>
          <div className="text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Пароль</label>
            <div className="flex items-center justify-between mt-1 bg-slate-50 dark:bg-slate-950 rounded-2xl py-3 px-4">
              <span className="text-sm font-bold text-slate-900 dark:text-white">{quickRegResult.password}</span>
              <button onClick={() => {
                navigator.clipboard.writeText(quickRegResult.password);
                alert("Пароль скопирован!");
              }} className="text-brand-600 text-xs font-bold">Копировать</button>
            </div>
          </div>
        </div>

        <button 
          onClick={() => onBack && onBack()}
          className="w-full max-w-sm bg-brand-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-200 active:scale-95 transition-all"
        >
          Продолжить
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-8 text-center bg-slate-50 dark:bg-slate-950 py-12">
      <div className="w-20 h-20 bg-brand-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-brand-200 dark:shadow-brand-900/20">
        <Shield size={40} className="text-white" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
        {regType === 'login' ? 'Добро пожаловать' : regType === 'quick' ? 'Быстрый старт' : 'Полная регистрация'}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium text-sm">
        {regType === 'login' ? 'Войдите в свой аккаунт EGIN' : regType === 'quick' ? 'Начните быстро, а профиль заполните позже' : 'Создайте полноценный аккаунт'}
      </p>

      {/* Auth Mode Tabs */}
      <div className="w-full max-w-sm flex gap-2 mb-8 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl">
        <button 
          onClick={() => setRegType('login')}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
            regType === 'login' ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
          )}
        >
          Вход
        </button>
        <button 
          onClick={() => setRegType('quick')}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
            regType === 'quick' ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
          )}
        >
          Быстрая
        </button>
        <button 
          onClick={() => setRegType('full')}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
            regType === 'full' ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
          )}
        >
          Полная
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {regType === 'quick' && (
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Email или Номер телефона"
              value={email || phone}
              onChange={(e) => {
                const val = e.target.value;
                if (val.includes('@')) {
                  setEmail(val);
                  setPhone('');
                } else {
                  setPhone(val);
                  setEmail('');
                }
              }}
              required
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
            />
          </div>
        )}

        {regType === 'full' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Имя"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Фамилия"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              />
            </div>
          </div>
        )}
        
        {regType !== 'quick' && (
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="email" 
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
            />
          </div>
        )}

        {regType === 'full' && (
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="tel" 
              placeholder="Номер телефона"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
            />
          </div>
        )}

        {regType !== 'quick' && (
          <div className="relative">
            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="password" 
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
            />
          </div>
        )}

        {regType === 'full' && (
          <div className="relative">
            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="password" 
              placeholder="Подтвердите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
            />
          </div>
        )}

        {regType === 'full' && (
          <>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Локация (например, Бишкек)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <FileText className="absolute left-4 top-4 text-slate-400" size={18} />
              <textarea 
                placeholder="О себе (био)"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3.5 pl-12 pr-4 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all h-24 resize-none"
              />
            </div>
          </>
        )}

        {error && <p className="text-xs text-red-500 font-bold">{error}</p>}

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-200 dark:shadow-brand-900/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : regType === 'login' ? 'Войти' : 'Создать аккаунт'}
        </button>
      </form>

      {/* Social Auth Section */}
      <div className="w-full max-w-sm mt-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Войти через</span>
          <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleSocialLogin('google')}
            className="flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3 rounded-2xl font-bold text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
            <span className="text-xs">Google</span>
          </button>
          <button 
            onClick={() => handleSocialLogin('yandex')}
            className="flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3 rounded-2xl font-bold text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <div className="w-4 h-4 bg-red-600 rounded-sm flex items-center justify-center text-[10px] text-white font-black">Я</div>
            <span className="text-xs">Yandex</span>
          </button>
          <button 
            onClick={() => handleSocialLogin('vk')}
            className="flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3 rounded-2xl font-bold text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center text-[10px] text-white font-black">VK</div>
            <span className="text-xs">VK</span>
          </button>
          <button 
            onClick={() => handleSocialLogin('linkedin')}
            className="flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3 rounded-2xl font-bold text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <div className="w-4 h-4 bg-blue-800 rounded-sm flex items-center justify-center text-[10px] text-white font-black">in</div>
            <span className="text-xs">LinkedIn</span>
          </button>
          <button 
            onClick={() => handleSocialLogin('instagram')}
            className="col-span-2 flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3 rounded-2xl font-bold text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <div className="w-4 h-4 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-sm"></div>
            <span className="text-xs">Instagram</span>
          </button>
        </div>
      </div>

      {onBack && (
        <button 
          onClick={onBack}
          className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest"
        >
          Пропустить
        </button>
      )}
    </div>
  );
};

export default function App() {
  const { currentUser, userRole, loading: authLoading } = useAuth();
  const [view, setView] = useState<View>('home');
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system';
    }
    return 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (t: Theme) => {
      let isDark = t === 'dark';
      if (t === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(MOCK_PRODUCTS[0]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [selectedCommunityCategory, setSelectedCommunityCategory] = useState<CommunityCategory | null>(null);
  const [selectedChat, setSelectedChat] = useState<CommunityChat | null>(null);
  const [showAIReport, setShowAIReport] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [user, setUser] = useState<UserProfile>(MOCK_USER);

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUser({
            id: currentUser.uid,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            fullName: data.fullName || data.displayName || currentUser.displayName || 'Пользователь',
            name: data.fullName || data.displayName || currentUser.displayName || 'Пользователь',
            username: data.username || '',
            email: currentUser.email || '',
            phone: data.phone || '',
            avatar: data.photoURL || data.avatar || currentUser.photoURL || 'https://picsum.photos/seed/user/150/150',
            role: data.role || userRole || 'user',
            location: data.location || 'Бишкек, Кыргызстан',
            bio: data.bio || '',
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0,
            postsCount: data.postsCount || 0,
            listingsCount: data.listingsCount || 0,
            soldCount: data.soldCount || 0,
            rating: data.rating || 0,
            verified: data.verified || false,
            quickRegistration: data.quickRegistration || false,
            registrationLevel: data.registrationLevel || 'full',
            provider: data.provider || 'email',
            joinedDate: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'Март 2024'
          });
        }
      });
      return () => unsubscribe();
    }
  }, [currentUser, userRole]);

  const handleListingClick = async (id: string) => {
    // Try mock first for speed if it's a mock ID
    const mockProduct = MOCK_PRODUCTS.find(p => p.id === id);
    if (mockProduct) {
      setSelectedProduct(mockProduct);
      setView('details');
      return;
    }

    // Otherwise fetch from Firestore
    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSelectedProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        setView('details');
      } else {
        console.error("Product not found");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'products/' + id);
    }
  };

  const handleNewsClick = (news: NewsItem) => {
    setSelectedNews(news);
    setView('news_details');
  };

  const handleCommunityCategoryClick = (cat: CommunityCategory) => {
    setSelectedCommunityCategory(cat);
    setView('community_chats');
  };

  const handleChatClick = (chat: CommunityChat) => {
    setSelectedChat(chat);
    setView('chat_room');
  };

  const renderContent = () => {
    if (authLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Загрузка...</p>
        </div>
      );
    }

    // Protected views that require login
    const protectedViews: View[] = ['sell', 'admin', 'chat_room', 'community_chats', 'feed'];
    if (protectedViews.includes(view) && !currentUser) {
      return <LoginPage onBack={() => setView('home')} />;
    }

    switch (view) {
      case 'home':
        return (
          <main className="pb-32">
            <div className="grid grid-cols-2 gap-4 px-6 mt-4">
              <UnifiedAICard onScanClick={() => setShowAIReport(true)} />
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center cursor-pointer" onClick={() => setView('market')}>
                <span className="text-emerald-600 dark:text-emerald-400 mb-2"><Wheat size={24} /></span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Мои Культуры</h3>
              </div>
            </div>
            <div className="relative z-20 mt-6 bg-white dark:bg-slate-950 rounded-t-[4rem] pt-12">
              <ListingsSection onListingClick={handleListingClick} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <NewsSection onNewsClick={handleNewsClick} />
                <BlogSection onPostClick={handleNewsClick} />
                <ReviewsSection />
                <FAQSection />
              </div>
            </div>
          </main>
        );
      case 'market':
        return <MarketplacePage onProductClick={handleListingClick} onAddClick={() => setView('sell')} />;
      case 'admin':
        return userRole === 'admin' ? (
          <AdminPanel 
            onSeed={seedDatabase} 
            onClear={clearDatabase} 
            onUserClick={(u) => {
              setSelectedUserProfile(u);
              setView('profile');
            }}
          />
        ) : <div className="p-12 text-center">Доступ запрещен</div>;
      case 'details':
        return selectedProduct ? (
          <ProductDetailsPage 
            product={selectedProduct} 
            onChatClick={(seller) => {
              setSelectedChat({
                id: 'seller-' + selectedProduct.id,
                name: seller.name,
                lastMessage: 'Здравствуйте! Я по поводу ' + selectedProduct.name,
                members: 2,
                image: seller.avatar
              });
              setView('chat_room');
            }}
          />
        ) : null;
      case 'news_details':
        return selectedNews ? <NewsDetailsPage news={selectedNews} /> : null;
      case 'ai':
        return <AIAssistantPage />;
      case 'communities':
        return <CommunitiesPage onCategoryClick={handleCommunityCategoryClick} />;
      case 'community_chats':
        return selectedCommunityCategory ? <ChatListPage category={selectedCommunityCategory} onChatClick={handleChatClick} /> : null;
      case 'chat_room':
        return selectedChat ? <ChatRoomPage chat={selectedChat} /> : null;
      case 'sell':
        return <SellPage />;
      case 'login':
        return <LoginPage onBack={() => setView('home')} />;
      case 'feed':
        return <FeedPage onProfileClick={(userId) => {
          const fetchAndShowProfile = async () => {
            const docSnap = await getDoc(doc(db, 'users', userId));
            if (docSnap.exists()) {
              const data = docSnap.data();
              setSelectedUserProfile({
                id: userId,
                name: data.displayName || 'Пользователь',
                email: data.email || '',
                avatar: data.photoURL || 'https://picsum.photos/seed/user/150/150',
                role: data.role || 'user',
                location: data.location || 'Бишкек, Кыргызстан',
                bio: data.bio || '',
                followersCount: data.followersCount || 0,
                followingCount: data.followingCount || 0,
                listingsCount: data.listingsCount || 0,
                soldCount: data.soldCount || 0,
                rating: data.rating || 0,
                joinedDate: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'Март 2024'
              });
              setView('profile');
            }
          };
          fetchAndShowProfile();
        }} />;
      case 'profile':
        return selectedUserProfile ? (
          <ProfilePage 
            user={selectedUserProfile} 
            onUpdateUser={(u) => {
              if (u.id === user.id) setUser(u);
              setSelectedUserProfile(u);
            }} 
            theme={theme} 
            setTheme={setTheme} 
            onSellClick={() => setView('sell')} 
            isAuthenticated={!!currentUser}
            onLoginClick={() => setView('login')}
          />
        ) : null;
      case 'settings':
        return <ProfilePage 
          user={user} 
          onUpdateUser={setUser} 
          theme={theme} 
          setTheme={setTheme} 
          onSellClick={() => setView('sell')} 
          isAuthenticated={!!currentUser}
          onLoginClick={() => setView('login')}
        />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 px-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
              <LayoutGrid size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Раздел в разработке</h3>
            <p className="text-sm mt-2">Мы работаем над тем, чтобы сделать этот раздел доступным как можно скорее.</p>
            <button 
              onClick={() => setView('home')}
              className="mt-6 px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold"
            >
              Вернуться на главную
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 w-full md:max-w-2xl lg:max-w-4xl xl:max-w-6xl md:mx-auto md:shadow-2xl relative transition-colors duration-300">
      <Header 
        title={
          view === 'details' ? (selectedProduct?.name || 'Детали') : 
          view === 'market' ? 'Рынок' : 
          view === 'home' ? 'EGIN' : 
          view === 'ai' ? 'AI Помощник' : 
          view === 'communities' ? 'Сообщества' :
          view === 'community_chats' ? (selectedCommunityCategory?.name || 'Чаты') :
          view === 'chat_room' ? (selectedChat?.name || 'Чат') :
          view === 'news_details' ? 'Новости' :
          view === 'sell' ? 'Продать' :
          view === 'settings' ? 'Профиль' : 
          view === 'feed' ? 'Лента' :
          view === 'profile' ? (selectedUserProfile?.name || 'Профиль') : 'EGIN'
        } 
        location={view === 'market' ? 'Бишкек, Кыргызстан' : undefined}
        showBack={view !== 'home'}
        onBack={() => {
          if (view === 'details') setView('market');
          else if (view === 'news_details') setView('home');
          else if (view === 'community_chats') setView('communities');
          else if (view === 'chat_room') setView('community_chats');
          else if (view === 'sell') setView('market');
          else if (view === 'ai') setView('home');
          else if (view === 'market') setView('home');
          else if (view === 'communities') setView('home');
          else if (view === 'settings') setView('home');
          else if (view === 'login') setView('home');
          else if (view === 'feed') setView('home');
          else if (view === 'profile') setView('feed');
          else setView('home');
        }}
        onMessageClick={() => setView('communities')}
        onCartClick={() => setView('market')}
        onAddClick={view === 'market' ? () => setView('sell') : undefined}
        isHome={view === 'home'}
      />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={view + (selectedProduct?.id || '') + (selectedNews?.id || '') + (selectedChat?.id || '')}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showAIReport && <AIPhotoReport onClose={() => setShowAIReport(false)} />}
      </AnimatePresence>

      {view === 'home' && (
        <>
          <ChatFAB />
        </>
      )}

      <BottomNav 
        activeTab={view === 'community_chats' || view === 'chat_room' ? 'communities' : view} 
        onTabChange={(t) => setView(t)} 
        isAdmin={userRole === 'admin'}
      />
    </div>
  );
}
