"use client";

import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react"

export default function PyUSDYieldSelector() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="pt-8 pb-4">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">py</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">PyInvest</h1>
              <p className="text-gray-600 text-sm">Easily securely put digital money to work in 1 click</p>
            </div>
          </div>
        </div>

        {/* Balance Display */}
        <div className="rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm">
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-2">Amount</p>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-gray-300 text-4xl font-light">$</span>
              <p className="text-4xl font-medium text-gray-800">12,450.00</p>
              <img 
                src="/assets/pyusd_logo.png" 
                alt="pyUSD logo" 
                className="h-6 w-6 ml-1"
              />
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Balance sources</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img 
                      src="/assets/Venmo-icon.png" 
                      alt="Venmo" 
                      className="h-4 w-4 mr-2"
                    />
                    <span className="text-sm text-gray-500">Venmo</span>
                  </div>
                  <span className="text-sm text-gray-500">$8,250.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img 
                      src="/assets/coinbase-icon.png" 
                      alt="Coinbase" 
                      className="h-4 w-4 mr-2"
                    />
                    <span className="text-sm text-gray-500">Coinbase</span>
                  </div>
                  <span className="text-sm text-gray-500">$4,200.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Options */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 px-2">Choose your yield strategy</h2>

          {/* Conservative Vault */}
          <div className="rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Conservative Vault</h3>
                    <p className="text-sm text-gray-500">Low risk, stable returns</p>
                  </div>
                </div>
                <div className="inline-flex items-center rounded-full border border-transparent bg-gray-100 text-gray-900 px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-700 border-green-200">
                  Stable
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Expected APY</span>
                  <span className="font-semibold text-green-600">4.2% - 5.8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Lock period</span>
                  <span className="font-medium text-gray-900">30 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Risk level</span>
                  <span className="font-medium text-gray-900">Low</span>
                </div>
              </div>

              <button className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-11 px-8 bg-blue-600 text-white hover:bg-blue-700 group-hover:bg-blue-700">
                <span>1-click invest</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>

          {/* Growth Vault */}
          <div className="rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Growth Vault</h3>
                    <p className="text-sm text-gray-500">Higher potential returns</p>
                  </div>
                </div>
                <div className="inline-flex items-center rounded-full border border-transparent bg-gray-100 text-gray-900 px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200">
                  Growth
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Expected APY</span>
                  <span className="font-semibold text-blue-600">8.5% - 12.3%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Lock period</span>
                  <span className="font-medium text-gray-900">90 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Risk level</span>
                  <span className="font-medium text-gray-900">Medium</span>
                </div>
              </div>

              <button className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-11 px-8 bg-blue-600 text-white hover:bg-blue-700 group-hover:bg-blue-700">
                <span>1-click invest</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-lg border-0 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="p-6 text-white">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="w-5 h-5" />
              <h3 className="font-semibold">Instant Deployment</h3>
            </div>
            <p className="text-sm text-blue-100 mb-4">Your pyUSD starts earning yield immediately after investment</p>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">$2.4M+</p>
                <p className="text-xs text-blue-100">Total Value Locked</p>
              </div>
              <div>
                <p className="text-2xl font-bold">1,200+</p>
                <p className="text-xs text-blue-100">Active Investors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pb-8">
          <p>Powered by institutional-grade DeFi protocols</p>
          <p className="mt-1">Your funds are secured by smart contracts</p>
        </div>
      </div>
    </div>
  )
}