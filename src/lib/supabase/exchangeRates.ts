import { createClient } from './client';

export interface ExchangeRate {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  date: string;
  period_type: 'daily' | 'monthly';
  created_at?: string;
  updated_at?: string;
}

// 지원하는 통화 목록
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: '미국 달러', flag: '🇺🇸' },
  { code: 'EUR', name: '유로화', flag: '🇪🇺' },
  { code: 'JPY', name: '일본 엔', flag: '🇯🇵' },
  { code: 'CNY', name: '중국 위안', flag: '🇨🇳' },
  { code: 'TWD', name: '대만 달러', flag: '🇹🇼' },
  { code: 'HKD', name: '홍콩 달러', flag: '🇭🇰' },
  { code: 'SGD', name: '싱가포르 달러', flag: '🇸🇬' },
  { code: 'VND', name: '베트남 동', flag: '🇻🇳' },
  { code: 'THB', name: '태국 바트', flag: '🇹🇭' },
  { code: 'MYR', name: '말레이시아 링깃', flag: '🇲🇾' },
  { code: 'IDR', name: '인도네시아 루피아', flag: '🇮🇩' },
  { code: 'PHP', name: '필리핀 페소', flag: '🇵🇭' },
  { code: 'KRW', name: '대한민국 원', flag: '🇰🇷' },
  { code: 'GBP', name: '영국 파운드', flag: '🇬🇧' },
  { code: 'CAD', name: '캐나다 달러', flag: '🇨🇦' },
  { code: 'AUD', name: '호주 달러', flag: '🇦🇺' },
  { code: 'NZD', name: '뉴질랜드 달러', flag: '🇳🇿' },
] as const;

const BASE_CURRENCY = 'KRW';

/**
 * 최근 30일 일별 환율 조회
 */
export async function getDailyExchangeRates(
  targetCurrency: string,
  days: number = 30
): Promise<ExchangeRate[]> {
  const supabase = createClient();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('base_currency', BASE_CURRENCY)
    .eq('target_currency', targetCurrency)
    .eq('period_type', 'daily')
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) {
    console.error('일별 환율 조회 실패:', error);
    return [];
  }

  return data || [];
}

/**
 * 월별 환율 조회 (최근 2년 11개월)
 */
export async function getMonthlyExchangeRates(
  targetCurrency: string,
  months: number = 35
): Promise<ExchangeRate[]> {
  const supabase = createClient();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('base_currency', BASE_CURRENCY)
    .eq('target_currency', targetCurrency)
    .eq('period_type', 'monthly')
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) {
    console.error('월별 환율 조회 실패:', error);
    return [];
  }

  return data || [];
}

/**
 * 모든 통화의 최신 환율 조회
 */
export async function getLatestExchangeRates(): Promise<Record<string, ExchangeRate>> {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('base_currency', BASE_CURRENCY)
    .eq('period_type', 'daily')
    .lte('date', today)
    .order('date', { ascending: false });

  if (error) {
    console.error('최신 환율 조회 실패:', error);
    return {};
  }

  // 각 통화별로 가장 최근 환율만 반환
  const latestRates: Record<string, ExchangeRate> = {};
  const seenCurrencies = new Set<string>();

  for (const rate of (data || []) as any[]) {
    if (!seenCurrencies.has(rate.target_currency)) {
      latestRates[rate.target_currency] = rate;
      seenCurrencies.add(rate.target_currency);
    }
  }

  return latestRates;
}

/**
 * 특정 날짜의 환율 조회
 */
export async function getExchangeRateOnDate(
  targetCurrency: string,
  date: string
): Promise<ExchangeRate | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('base_currency', BASE_CURRENCY)
    .eq('target_currency', targetCurrency)
    .lte('date', date)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('환율 조회 실패:', error);
    return null;
  }

  return data;
}

