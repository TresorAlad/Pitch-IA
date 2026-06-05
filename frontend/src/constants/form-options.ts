import type { SelectOption } from '../types/select'
import {
  Award,
  Bike,
  BookOpen,
  Cloud,
  CreditCard,
  Flag,
  Globe2,
  Handshake,
  Leaf,
  Lightbulb,
  ShoppingCart,
  Sprout,
  Stethoscope,
  TrendingUp,
  Truck,
  User,
  UtensilsCrossed,
} from 'lucide-react'

export const COUNTRY_OPTIONS: SelectOption[] = [
  { value: 'tg', label: 'Togo', icon: Flag, iconClass: 'text-lime-600' },
  { value: 'ci', label: "Côte d'Ivoire", icon: Flag, iconClass: 'text-orange-600' },
  { value: 'sn', label: 'Sénégal', icon: Flag, iconClass: 'text-emerald-600' },
  { value: 'ml', label: 'Mali', icon: Flag, iconClass: 'text-yellow-600' },
  { value: 'bf', label: 'Burkina Faso', icon: Flag, iconClass: 'text-red-600' },
  { value: 'ne', label: 'Niger', icon: Flag, iconClass: 'text-orange-500' },
  { value: 'bj', label: 'Bénin', icon: Flag, iconClass: 'text-green-600' },
  { value: 'gw', label: 'Guinée-Bissau', icon: Flag, iconClass: 'text-red-500' },
  { value: 'uemoa', label: 'Afrique de l\'Ouest (zone)', icon: Globe2, iconClass: 'text-brand' },
]

export const SECTOR_OPTIONS: SelectOption[] = [
  { value: 'FinTech', label: 'FinTech', icon: CreditCard, iconClass: 'text-violet-600' },
  { value: 'AgriTech', label: 'AgriTech', icon: Sprout, iconClass: 'text-green-600' },
  { value: 'EdTech', label: 'EdTech', icon: BookOpen, iconClass: 'text-blue-600' },
  { value: 'HealthTech', label: 'HealthTech', icon: Stethoscope, iconClass: 'text-rose-600' },
  { value: 'FoodTech', label: 'FoodTech', icon: UtensilsCrossed, iconClass: 'text-orange-600' },
  { value: 'LogisTech', label: 'LogisTech', icon: Truck, iconClass: 'text-slate-600' },
  { value: 'E-commerce', label: 'E-commerce', icon: ShoppingCart, iconClass: 'text-indigo-600' },
  { value: 'SaaS B2B', label: 'SaaS B2B', icon: Cloud, iconClass: 'text-sky-600' },
  { value: 'CleanTech', label: 'CleanTech', icon: Leaf, iconClass: 'text-emerald-600' },
  { value: 'Mobility', label: 'Mobility', icon: Bike, iconClass: 'text-cyan-600' },
  { value: 'Autre', label: 'Autre', icon: Lightbulb, iconClass: 'text-amber-600' },
]

export const AUDIENCE_OPTIONS: SelectOption[] = [
  { value: 'investisseur', label: 'Investisseur', icon: TrendingUp, iconClass: 'text-emerald-600' },
  { value: 'client', label: 'Client final', icon: User, iconClass: 'text-blue-600' },
  { value: 'partenaire', label: 'Partenaire B2B', icon: Handshake, iconClass: 'text-violet-600' },
  { value: 'incubateur', label: 'Incubateur / jury', icon: Award, iconClass: 'text-amber-600' },
]

export const PITCH_SECTIONS = [
  { key: 'probleme' as const, title: 'Problème' },
  { key: 'solution' as const, title: 'Solution' },
  { key: 'marche' as const, title: 'Marché' },
  { key: 'valeur' as const, title: 'Proposition de valeur' },
  { key: 'canaux' as const, title: 'Canaux de distribution' },
  { key: 'modele' as const, title: 'Modèle économique' },
]
