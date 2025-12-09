"use client";

import { useState, useEffect } from 'react';
import { 
  getDailyExchangeRates, 
  getMonthlyExchangeRates, 
  getLatestExchangeRates,
  SUPPORTED_CURRENCIES,
  type ExchangeRate 
} from '@/lib/supabase/exchangeRates';

export default function ExchangeRates() {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [dailyRates, setDailyRates] = useState<ExchangeRate[]>([]);
  const [monthlyRates, setMonthlyRates] = useState<ExchangeRate[]>([]);
  const [latestRates, setLatestRates] = useState<Record<string, ExchangeRate>>({});
  const [loading, setLoading] = useState(true);

  // 최신 환율 로드
  useEffect(() => {
    const loadLatestRates = async () => {
      const rates = await getLatestExchangeRates();
      setLatestRates(rates);
      setLoading(false);
    };
    loadLatestRates();
  }, []);

  // 선택된 통화의 환율 데이터 로드
  useEffect(() => {
    const loadRates = async () => {
      setLoading(true);
      const [daily, monthly] = await Promise.all([
        getDailyExchangeRates(selectedCurrency, 30),
        getMonthlyExchangeRates(selectedCurrency, 35)
      ]);
      setDailyRates(daily);
      setMonthlyRates(monthly);
      setLoading(false);
    };
    loadRates();
  }, [selectedCurrency]);

  const currentRate = latestRates[selectedCurrency]?.rate || 0;
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency);

  // 차트 데이터 준비 (최근 30일 일별 + 이전 월별)
  const chartData = [
    ...dailyRates.map(rate => ({
      date: new Date(rate.date),
      rate: Number(rate.rate),
      type: 'daily' as const
    })),
    ...monthlyRates.map(rate => ({
      date: new Date(rate.date),
      rate: Number(rate.rate),
      type: 'monthly' as const
    }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  // 최고/최저 환율 계산
  const rates = chartData.map(d => d.rate);
  const maxRate = rates.length > 0 ? Math.max(...rates) : 0;
  const minRate = rates.length > 0 ? Math.min(...rates) : 0;
  const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;

  return (
    <div className="w-full h-full p-4 md:p-6 overflow-y-auto" style={{ backgroundColor: '#FCECA3' }}>
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#163C69' }}>
            💱 환율 정보
          </h1>
          <p className="text-sm md:text-base" style={{ color: '#5AA8E5' }}>
            최근 3년간의 환율 추이를 확인하세요
          </p>
        </div>

        {/* 통화 선택 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => setSelectedCurrency(currency.code)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all active:scale-95 flex items-center gap-2 ${
                  selectedCurrency === currency.code
                    ? 'text-white'
                    : 'text-gray-700'
                }`}
                style={
                  selectedCurrency === currency.code
                    ? {
                        backgroundColor: '#5AA8E5',
                        border: '2px solid #1F6FB8',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }
                    : {
                        backgroundColor: '#FFFFFF',
                        border: '2px solid #E5E7EB',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      }
                }
                onMouseEnter={(e) => {
                  if (selectedCurrency !== currency.code) {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                    e.currentTarget.style.borderColor = '#5AA8E5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCurrency !== currency.code) {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }
                }}
              >
                <span>{currency.flag}</span>
                <span>{currency.code}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4" style={{ borderColor: '#5AA8E5' }}></div>
              <p className="text-lg font-medium" style={{ color: '#163C69' }}>환율 정보 로딩중...</p>
            </div>
          </div>
        ) : (
          <>
            {/* 현재 환율 카드 */}
            {currencyInfo && (
              <div className="mb-6 p-6 rounded-xl" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl">{currencyInfo.flag}</span>
                      <div>
                        <h2 className="text-2xl font-bold" style={{ color: '#163C69' }}>
                          {currencyInfo.name} ({currencyInfo.code})
                        </h2>
                        <p className="text-sm" style={{ color: '#5AA8E5' }}>
                          기준 통화: KRW (대한민국 원)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm mb-1" style={{ color: '#5AA8E5' }}>현재 환율</p>
                    <p className="text-4xl font-bold" style={{ color: '#1F6FB8' }}>
                      1 {currencyInfo.code} = {currentRate.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KRW
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 통계 카드 */}
            {rates.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <p className="text-sm mb-1" style={{ color: '#5AA8E5' }}>최고 환율</p>
                  <p className="text-2xl font-bold" style={{ color: '#163C69' }}>
                    {maxRate.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <p className="text-sm mb-1" style={{ color: '#5AA8E5' }}>평균 환율</p>
                  <p className="text-2xl font-bold" style={{ color: '#163C69' }}>
                    {avgRate.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <p className="text-sm mb-1" style={{ color: '#5AA8E5' }}>최저 환율</p>
                  <p className="text-2xl font-bold" style={{ color: '#163C69' }}>
                    {minRate.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}

            {/* 환율 차트 영역 */}
            {chartData.length > 0 ? (
              <div className="p-6 rounded-xl" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h3 className="text-xl font-bold mb-4" style={{ color: '#163C69' }}>
                  환율 추이 (최근 3년)
                </h3>
                <div className="h-64 md:h-96 relative">
                  {/* 간단한 차트 (SVG로 구현) */}
                  <svg width="100%" height="100%" className="overflow-visible">
                    <defs>
                      <linearGradient id="rateGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#5AA8E5" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#5AA8E5" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* 그리드 라인 */}
                    {[0, 0.25, 0.5, 0.75, 1].map((y) => (
                      <line
                        key={y}
                        x1="0%"
                        y1={`${y * 100}%`}
                        x2="100%"
                        y2={`${y * 100}%`}
                        stroke="#E5E7EB"
                        strokeWidth="1"
                      />
                    ))}
                    {/* 차트 영역 */}
                    {chartData.length > 1 && (() => {
                      const width = 100;
                      const height = 100;
                      const padding = 5;
                      const chartWidth = width - padding * 2;
                      const chartHeight = height - padding * 2;
                      const minRate = Math.min(...chartData.map(d => d.rate));
                      const maxRate = Math.max(...chartData.map(d => d.rate));
                      const rateRange = maxRate - minRate || 1;

                      // 경로 생성
                      const points = chartData.map((d, i) => {
                        const x = padding + (i / (chartData.length - 1)) * chartWidth;
                        const y = padding + ((maxRate - d.rate) / rateRange) * chartHeight;
                        return `${x},${y}`;
                      }).join(' ');

                      // 영역 채우기
                      const areaPath = `M ${padding},${padding + chartHeight} L ${points} L ${padding + chartWidth},${padding + chartHeight} Z`;

                      return (
                        <>
                          <path
                            d={areaPath}
                            fill="url(#rateGradient)"
                          />
                          <polyline
                            points={points}
                            fill="none"
                            stroke="#5AA8E5"
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                          />
                        </>
                      );
                    })()}
                  </svg>
                </div>
                <div className="mt-4 text-sm" style={{ color: '#5AA8E5' }}>
                  <p>• 최근 30일: 일별 환율</p>
                  <p>• 그 이전: 월별 환율</p>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl text-center" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <p className="text-lg" style={{ color: '#5AA8E5' }}>
                  환율 데이터가 없습니다. 관리자가 데이터를 추가해주세요.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

