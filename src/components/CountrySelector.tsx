"use client";

import { useState } from 'react';
import { Country, continents } from '@/lib/countries';

interface CountrySelectorProps {
  countries: Country[];
  visitedCountries: Map<string, number>;
  onToggleCountry: (code: string) => void;
  onIncreaseVisits: (code: string) => void;
  onDecreaseVisits: (code: string) => void;
}

export default function CountrySelector({
  countries,
  visitedCountries,
  onToggleCountry,
  onIncreaseVisits,
  onDecreaseVisits,
}: CountrySelectorProps) {
  const [selectedContinent, setSelectedContinent] = useState<string>("전체");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = countries.filter((country) => {
    const matchesContinent = selectedContinent === "전체" || country.continent === selectedContinent;
    const matchesSearch = country.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesContinent && matchesSearch;
  });

  const visitedCount = visitedCountries.size;
  const totalCount = countries.length;
  const percentage = Math.round((visitedCount / totalCount) * 100);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-2xl">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          🌍 My Planet
        </h1>
        <p className="text-slate-400 text-sm">
          지구본을 돌려보세요! 당신의 여행 기록을 확인하세요
        </p>
      </div>

      {/* 통계 */}
      <div className="mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 text-sm">방문한 국가</span>
          <span className="text-2xl font-bold text-blue-400">
            {visitedCount} / {totalCount}
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 mb-1">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 text-right">
          세계 정복률 {percentage}%
        </p>
      </div>

      {/* 검색 */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 국가 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 대륙 필터 */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedContinent("전체")}
          className={`px-3 py-1 rounded-full text-sm transition-all ${
            selectedContinent === "전체"
              ? "bg-blue-500 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          전체
        </button>
        {continents.map((continent) => (
          <button
            key={continent}
            onClick={() => setSelectedContinent(continent)}
            className={`px-3 py-1 rounded-full text-sm transition-all ${
              selectedContinent === continent
                ? "bg-blue-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {continent}
          </button>
        ))}
      </div>

      {/* 국가 목록 */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {filteredCountries.map((country) => {
          const visits = visitedCountries.get(country.code) || 0;
          const isVisited = visits > 0;
          return (
            <div
              key={country.code}
              className={`w-full p-3 rounded-lg transition-all ${
                isVisited
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg"
                  : "bg-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onToggleCountry(country.code)}
                  className="flex items-center gap-3 flex-1"
                >
                  <span className="text-2xl">{country.flag}</span>
                  <div className="text-left">
                    <p className="font-medium">{country.name}</p>
                    <p className="text-xs text-slate-400">{country.continent}</p>
                  </div>
                </button>
                
                {isVisited && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDecreaseVisits(country.code);
                      }}
                      className="w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white font-bold transition-all"
                    >
                      −
                    </button>
                    <div className="min-w-[60px] text-center">
                      <p className="text-yellow-400 font-bold text-lg">{visits}회</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onIncreaseVisits(country.code);
                      }}
                      className="w-7 h-7 rounded-full bg-yellow-500 hover:bg-yellow-400 flex items-center justify-center text-slate-900 font-bold transition-all"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}

