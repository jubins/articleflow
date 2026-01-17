'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AuthLayout } from '@/components/AuthLayout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Article } from '@/lib/types/database'

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('1W')
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; count: number; date: string } | null>(null)
  const [allArticles, setAllArticles] = useState<Article[]>([])
  const [stats, setStats] = useState({
    total: 0,
    generated: 0,
    failed: 0,
    draft: 0,
    totalWords: 0,
    avgWords: 0,
    thisWeek: 0,
    thisMonth: 0,
  })
  const [articleTypeStats, setArticleTypeStats] = useState<Record<string, number>>({})
  const [activityData, setActivityData] = useState<{ date: string; count: number }[]>([])
  const [aiProviderStats, setAIProviderStats] = useState<Record<string, number>>({})

  useEffect(() => {
    loadArticles()
  }, [])

  useEffect(() => {
    if (allArticles.length > 0) {
      calculateActivityData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, allArticles])

  const loadArticles = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Get all articles (not just 20)
      const { data: articlesData, error } = await supabase
        .from('articles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const typedArticles = (articlesData || []) as Article[]
      setAllArticles(typedArticles)

      // Calculate stats
      const total = typedArticles.length
      const generated = typedArticles.filter(a => a.status === 'generated').length
      const failed = typedArticles.filter(a => a.status === 'failed').length
      const draft = typedArticles.filter(a => a.status === 'draft').length

      // Word count stats
      const totalWords = typedArticles.reduce((sum, a) => sum + (a.word_count || 0), 0)
      const avgWords = total > 0 ? Math.round(totalWords / total) : 0

      // Time-based stats
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const thisWeek = typedArticles.filter(a => new Date(a.created_at) > oneWeekAgo).length
      const thisMonth = typedArticles.filter(a => new Date(a.created_at) > oneMonthAgo).length

      setStats({ total, generated, failed, draft, totalWords, avgWords, thisWeek, thisMonth })

      // Article type distribution
      const typeStats: Record<string, number> = {}
      typedArticles.forEach(a => {
        const type = a.article_type || 'technical'
        typeStats[type] = (typeStats[type] || 0) + 1
      })
      setArticleTypeStats(typeStats)

      // AI Provider stats
      const providerStats: Record<string, number> = {}
      typedArticles.forEach(a => {
        const provider = a.ai_provider || 'unknown'
        providerStats[provider] = (providerStats[provider] || 0) + 1
      })
      setAIProviderStats(providerStats)
    } catch (error) {
      console.error('Error loading articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateActivityData = () => {
    const now = new Date()
    const data: { date: string; count: number }[] = []

    // Get days and date format based on time range
    let days = 1
    let dateFormat: Intl.DateTimeFormatOptions = { hour: 'numeric', hour12: true }

    switch (timeRange) {
      case '1D':
        days = 1
        dateFormat = { hour: 'numeric', hour12: true }
        break
      case '1W':
        days = 7
        dateFormat = { month: 'short', day: 'numeric' }
        break
      case '1M':
        days = 30
        dateFormat = { month: 'short', day: 'numeric' }
        break
      case '3M':
        days = 90
        dateFormat = { month: 'short', day: 'numeric' }
        break
      case '1Y':
        days = 365
        dateFormat = { month: 'short', year: '2-digit' }
        break
      case '5Y':
        days = 1825
        dateFormat = { year: 'numeric' }
        break
    }

    // For longer ranges, group by appropriate intervals
    let groupSize = 1 // days
    if (timeRange === '1D') {
      groupSize = 1 / 24 // hourly for 1 day
    } else if (days > 365) {
      groupSize = 30 // monthly for 5Y
    } else if (days > 90) {
      groupSize = 7 // weekly for 1Y
    } else if (days > 30) {
      groupSize = 3 // every 3 days for 3M
    }

    const intervals = Math.ceil(days / groupSize)
    const maxBars = timeRange === '1D' ? 24 : 30 // 24 hours for 1D, 30 bars otherwise

    if (intervals > maxBars) {
      groupSize = Math.ceil(days / maxBars)
    }

    const totalIntervals = timeRange === '1D' ? 24 : Math.ceil(days / groupSize)

    for (let i = totalIntervals - 1; i >= 0; i--) {
      const millisPerInterval = groupSize * 24 * 60 * 60 * 1000
      const endDate = new Date(now.getTime() - i * millisPerInterval)
      const startDate = new Date(endDate.getTime() - (millisPerInterval - 1))

      const dateStr = endDate.toLocaleDateString('en-US', dateFormat)

      const count = allArticles.filter(a => {
        const createdAt = new Date(a.created_at)
        return createdAt >= startDate && createdAt <= endDate
      }).length

      data.push({ date: dateStr, count })
    }

    setActivityData(data)
  }

  if (loading) {
    return (
      <AuthLayout>
        <LoadingSpinner size="lg" className="mt-20" />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="px-4 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your article generation progress and analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Articles</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Generated</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.generated}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Drafts</p>
                  <p className="text-3xl font-bold text-gray-600 mt-2">{stats.draft}</p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{stats.failed}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Words</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalWords.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Words/Article</p>
                  <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.avgWords.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-3xl font-bold text-cyan-600 mt-2">{stats.thisWeek}</p>
                </div>
                <div className="h-12 w-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.thisMonth}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Activity Chart with Time Range Buttons Below */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>Article generation over time</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {activityData.length > 0 ? (
                <div className="space-y-4">
                  {/* Chart Container */}
                  <div
                    className="relative h-72 bg-white rounded-lg p-6 overflow-hidden border border-gray-100"
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* SVG Area Chart */}
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 800 240"
                      preserveAspectRatio="none"
                      className="absolute inset-0 pl-6 pr-6 pt-6"
                    >
                      <defs>
                        {/* Gradient for the area fill - bright green theme */}
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>

                      {(() => {
                        const maxCount = Math.max(...activityData.map(d => d.count), 1)
                        const width = 800
                        const height = 240
                        const padding = 40
                        const chartWidth = width - padding * 2
                        const chartHeight = height - padding * 2

                        // Create points for the line
                        const points = activityData.map((item, index) => {
                          const x = padding + (index / (activityData.length - 1)) * chartWidth
                          const y = padding + chartHeight - (item.count / maxCount) * chartHeight
                          return { x, y, count: item.count, date: item.date }
                        })

                        // Create smooth curve path using quadratic bezier curves
                        let pathD = `M ${points[0].x} ${points[0].y}`
                        for (let i = 0; i < points.length - 1; i++) {
                          const current = points[i]
                          const next = points[i + 1]
                          const midX = (current.x + next.x) / 2
                          pathD += ` Q ${current.x} ${current.y}, ${midX} ${(current.y + next.y) / 2}`
                        }
                        pathD += ` T ${points[points.length - 1].x} ${points[points.length - 1].y}`

                        // Create area path (same as line but closed to bottom)
                        const areaPath = `${pathD} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`

                        return (
                          <>
                            {/* Grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                              <line
                                key={i}
                                x1={padding}
                                y1={padding + chartHeight * ratio}
                                x2={width - padding}
                                y2={padding + chartHeight * ratio}
                                stroke="#f3f4f6"
                                strokeWidth="1"
                              />
                            ))}

                            {/* Area fill */}
                            <path
                              d={areaPath}
                              fill="url(#areaGradient)"
                            />

                            {/* Line stroke - bright green */}
                            <path
                              d={pathD}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Interactive dots and hover areas */}
                            {points.map((point, index) => (
                              <g key={index}>
                                {/* Invisible hover area */}
                                <rect
                                  x={point.x - 15}
                                  y={padding}
                                  width="30"
                                  height={chartHeight}
                                  fill="transparent"
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredPoint(point)}
                                />

                                {/* Show dot when hovering */}
                                {hoveredPoint?.x === point.x && (
                                  <>
                                    {/* Vertical line from point to bottom */}
                                    <line
                                      x1={point.x}
                                      y1={point.y}
                                      x2={point.x}
                                      y2={height - padding}
                                      stroke="#d1d5db"
                                      strokeWidth="1"
                                      strokeDasharray="4 4"
                                    />
                                    {/* Outer circle */}
                                    <circle
                                      cx={point.x}
                                      cy={point.y}
                                      r="6"
                                      fill="white"
                                      stroke="#10b981"
                                      strokeWidth="2"
                                    />
                                    {/* Inner dot */}
                                    <circle
                                      cx={point.x}
                                      cy={point.y}
                                      r="3"
                                      fill="#10b981"
                                    />
                                  </>
                                )}
                              </g>
                            ))}
                          </>
                        )
                      })()}
                    </svg>

                    {/* Hover tooltip */}
                    {hoveredPoint && (() => {
                      // Calculate tooltip position and ensure it stays within bounds
                      const tooltipWidth = 120 // estimated width in pixels
                      const leftPercent = (hoveredPoint.x / 800) * 100
                      const topPercent = (hoveredPoint.y / 240) * 100

                      // Clamp left position to prevent overflow
                      let adjustedLeft = leftPercent
                      if (leftPercent < 15) {
                        adjustedLeft = 15 // Left edge padding
                      } else if (leftPercent > 85) {
                        adjustedLeft = 85 // Right edge padding
                      }

                      // If point is too high, show tooltip below instead of above
                      const showBelow = topPercent < 25

                      return (
                        <div
                          className="absolute bg-gray-900 text-white text-xs px-3 py-2 rounded-md shadow-lg pointer-events-none z-10 whitespace-nowrap"
                          style={{
                            left: `${adjustedLeft}%`,
                            top: showBelow ? `${topPercent + 5}%` : `${topPercent - 5}%`,
                            transform: showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'
                          }}
                        >
                          <div className="font-semibold">{hoveredPoint.count} article{hoveredPoint.count !== 1 ? 's' : ''}</div>
                          <div className="text-gray-400 text-xs mt-0.5">{hoveredPoint.date}</div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Time Range Buttons Below Chart */}
                  <div className="flex items-center justify-center gap-2">
                    {(['1D', '1W', '1M', '3M', '1Y', '5Y'] as TimeRange[]).map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                          timeRange === range
                            ? 'bg-emerald-500 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-72 bg-white rounded-lg flex items-center justify-center border border-gray-100">
                  <p className="text-gray-400 text-sm">No articles generated yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Provider Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>AI Provider Usage</CardTitle>
              <CardDescription>Distribution by AI model</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(aiProviderStats).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(aiProviderStats).map(([provider, count]) => {
                    const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                    const providerColors = {
                      claude: 'from-orange-500 to-red-600',
                      gemini: 'from-blue-500 to-indigo-600',
                      openai: 'from-green-500 to-emerald-600',
                    }
                    const color = providerColors[provider.toLowerCase() as keyof typeof providerColors] || 'from-gray-500 to-gray-600'
                    return (
                      <div key={provider} className="group">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 capitalize">{provider}</span>
                          <span className="text-sm text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`bg-gradient-to-r ${color} h-full rounded-full transition-all duration-500 group-hover:opacity-80`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Article Types Distribution */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Article Types Distribution</CardTitle>
            <CardDescription>Breakdown of articles by type</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(articleTypeStats).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(articleTypeStats).map(([type, count]) => {
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                  return (
                    <div key={type} className="group">
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200 hover:border-blue-400 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-700 capitalize">{type}</span>
                          <span className="text-2xl font-bold text-blue-600">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-gray-600 text-right">{percentage.toFixed(1)}% of total</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}
