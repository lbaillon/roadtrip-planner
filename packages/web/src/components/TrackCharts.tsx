import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { GpxCoordinate, WeatherData } from '@roadtrip/shared'
import { haversineDistanceKm } from '#web/lib/gpx-utils'

interface TrackChartsProps {
  coordinates: GpxCoordinate[]
  weather: WeatherData[]
  timepointIndex: number[]
  departureTime: Date | null
  speedKmh: number | null
}

interface EnrichedPoint {
  distanceKm: number
  ele: number | null
  humidity: number | null
  windSpeed: number | null
}

type MetricKey = 'ele' | 'humidity' | 'windSpeed'

const COLORS: Record<MetricKey, string> = {
  ele: '#16a34a',
  humidity: '#2563eb',
  windSpeed: '#ea580c',
}

const GRADIENT_IDS: Record<MetricKey, string> = {
  ele: 'elevationGradient',
  humidity: 'humidityGradient',
  windSpeed: 'windSpeedGradient',
}

const LEGEND: Record<MetricKey, string> = {
  ele: '⛰️ Altitude',
  humidity: '💧 Humidité',
  windSpeed: '💨 Vent',
}

const formatValue: Record<MetricKey, (v: number) => string> = {
  ele: (v) => `${Math.round(v)} m`,
  humidity: (v) => `${v}%`,
  windSpeed: (v) => `${v.toFixed(1)} km/h`,
}

const findNearestWeather = (
  coord: GpxCoordinate,
  weatherPoints: WeatherData[]
): WeatherData | undefined =>
  weatherPoints.reduce((nearest, current) =>
    haversineDistanceKm(coord, current) < haversineDistanceKm(coord, nearest)
      ? current
      : nearest
  )

export function TrackCharts({
  coordinates,
  weather,
  timepointIndex,
  departureTime,
  speedKmh,
}: TrackChartsProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Track the rendered width so the chart redraws on resize / orientation change
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const update = () => setContainerWidth(el.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const weatherWithHumidity = weather.filter(
    (w, i): w is WeatherData & { humidity: number } =>
      w.timepoints[timepointIndex[i] ?? 0].humidity !== undefined
  )
  const weatherWithWindSpeed = weather.filter(
    (w, i): w is WeatherData & { windSpeed: number } =>
      w.timepoints[timepointIndex[i] ?? 0].windSpeed !== undefined
  )

  function getData(): EnrichedPoint[] {
    if (coordinates.length === 0) return []

    let cumulatedDistance = 0

    return coordinates.map((coord, i) => {
      if (i > 0) {
        cumulatedDistance += haversineDistanceKm(coordinates[i - 1], coord)
      }

      const nearestHumidity =
        weatherWithHumidity.length > 0
          ? findNearestWeather(coord, weatherWithHumidity)
          : undefined
      const nearestWind =
        weatherWithWindSpeed.length > 0
          ? findNearestWeather(coord, weatherWithWindSpeed)
          : undefined

      const humidity =
        nearestHumidity?.timepoints[timepointIndex[i] ?? 0].humidity ?? null
      const windSpeedMs =
        nearestWind?.timepoints[timepointIndex[i] ?? 0].windSpeed

      return {
        distanceKm: parseFloat(cumulatedDistance.toFixed(2)),
        ele: coord.ele ?? null,
        humidity,
        windSpeed: windSpeedMs != null ? windSpeedMs * 3.6 : null,
      }
    })
  }

  const data = getData()

  // Stable primitive key describing the drawn values, so the effect below has a
  // constant-length dependency array (the raw `data` array is rebuilt every render).
  const dataSignature = data
    .map(
      (d) =>
        `${d.distanceKm}:${d.ele ?? ''}:${d.humidity ?? ''}:${d.windSpeed ?? ''}`
    )
    .join('|')

  useEffect(() => {
    if (!svgRef.current || data.length === 0 || containerWidth === 0) return

    const presentKeys: MetricKey[] = (
      ['ele', 'humidity', 'windSpeed'] as MetricKey[]
    ).filter((key) => data.some((d) => d[key] != null))

    if (presentKeys.length === 0) return

    const margin = { top: 40, right: 24, bottom: 60, left: 20 }
    const width = containerWidth - margin.left - margin.right
    const height = 280 - margin.top - margin.bottom

    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3
      .select(svgRef.current)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Shared X scale (cumulative distance)
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.distanceKm) ?? 0])
      .range([0, width])

    // Each metric is normalized to [0, 100] over its own value range, so all
    // curves share the single percentage axis while keeping their real shape.
    const norm: Record<MetricKey, d3.ScaleLinear<number, number>> = {
      ele: d3.scaleLinear(),
      humidity: d3.scaleLinear(),
      windSpeed: d3.scaleLinear(),
    }
    presentKeys.forEach((key) => {
      const min = d3.min(data, (d) => d[key] ?? undefined) ?? 0
      const max = d3.max(data, (d) => d[key] ?? undefined) ?? 0
      // Guard against a flat series (min === max) → center it at 50%
      norm[key] =
        min === max
          ? d3
              .scaleLinear()
              .domain([min - 1, max + 1])
              .range([0, 100])
          : d3.scaleLinear().domain([min, max]).range([0, 100])
    })

    // Single shared Y scale in percentage of range, with headroom above 100%
    const yScale = d3.scaleLinear().domain([0, 120]).range([height, 0])

    const scaleY = (key: MetricKey, value: number) => yScale(norm[key](value))

    // Horizontal grid
    svg
      .append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g
          .selectAll('.tick line')
          .attr('stroke', '#e2e8f0')
          .attr('stroke-dasharray', '3,3')
      )

    // X axis (shared)
    const xAxis = svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickFormat((d) => `${d} km`)
      )
    xAxis.call((g) => g.select('.domain').attr('stroke', '#cbd5e1'))
    xAxis.call((g) => g.selectAll('.tick line').attr('stroke', '#cbd5e1'))
    xAxis.call((g) =>
      g
        .selectAll('.tick text')
        .attr('fill', '#64748b')
        .attr('font-size', '11px')
    )

    // When a departure time and speed are set, show the ETA at each tick's km
    if (departureTime && speedKmh) {
      const departureMs = departureTime.getTime()
      xAxis.selectAll<SVGTextElement, number>('.tick text').each(function (d) {
        const eta = new Date(departureMs + (d / speedKmh) * 3600 * 1000)
        d3.select(this)
          .append('tspan')
          .attr('x', 0)
          .attr('dy', '1.1em')
          .attr('fill', '#94a3b8')
          .text(
            eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          )
      })
    }

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height + 52)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '12px')
      .text('Distance (km)')

    // Legend (top)
    const legend = svg.append('g').attr('transform', `translate(0,${-22})`)
    let legendX = 0
    presentKeys.forEach((key) => {
      const item = legend
        .append('g')
        .attr('transform', `translate(${legendX},0)`)
      item
        .append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('rx', 3)
        .attr('y', -10)
        .attr('fill', COLORS[key])
      const text = item
        .append('text')
        .attr('x', 18)
        .attr('y', 0)
        .attr('fill', '#64748b')
        .attr('font-size', '12px')
        .text(LEGEND[key])
      legendX += 18 + (text.node()?.getComputedTextLength() ?? 60) + 22
    })

    const defs = svg.append('defs')

    // Draw each present metric: gradient + area + line
    presentKeys.forEach((key) => {
      // Keep only points that carry this metric, so d3 bridges the missing
      // ones instead of breaking the curve into disconnected segments.
      const points = data.filter((d) => d[key] != null)

      const gradient = defs
        .append('linearGradient')
        .attr('id', GRADIENT_IDS[key])
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', height)
      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', COLORS[key])
        .attr('stop-opacity', 0.15)
      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', COLORS[key])
        .attr('stop-opacity', 0.02)

      const area = d3
        .area<EnrichedPoint>()
        .x((d) => xScale(d.distanceKm))
        .y0(height)
        .y1((d) => scaleY(key, d[key] as number))
        .curve(d3.curveCatmullRom.alpha(0.5))

      svg
        .append('path')
        .datum(points)
        .attr('fill', `url(#${GRADIENT_IDS[key]})`)
        .attr('d', area)

      const line = d3
        .line<EnrichedPoint>()
        .x((d) => xScale(d.distanceKm))
        .y((d) => scaleY(key, d[key] as number))
        .curve(d3.curveCatmullRom.alpha(0.5))

      svg
        .append('path')
        .datum(points)
        .attr('fill', 'none')
        .attr('stroke', COLORS[key])
        .attr('stroke-width', 2)
        .attr('d', line)
    })

    // Left Y axis, drawn on top of the curves so it stays visible.
    // Ticks are shown but not labelled (the % scale isn't meaningful per curve).
    svg
      .append('g')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat(() => '')
      )
      .call((g) => g.select('.domain').attr('stroke', '#cbd5e1'))
      .call((g) => g.selectAll('.tick line').attr('stroke', '#cbd5e1'))

    // Shared tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background', 'white')
      .style('border', '1px solid #e2e8f0')
      .style('border-radius', '8px')
      .style('padding', '10px 14px')
      .style('font-size', '12px')
      .style('line-height', '1.6')
      .style('box-shadow', '0 4px 12px rgba(0,0,0,0.08)')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', '9999')
      .style('transition', 'opacity 0.15s ease')
      // Anchor point (left/top) is the tooltip's bottom-center, so it sits
      // centered above the cursor / finger
      .style('transform', 'translate(-50%, -100%)')

    // Single vertical hover line shared by all curves
    const hoverLine = svg
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,3')
      .attr('y1', 0)
      .attr('y2', height)
      .style('opacity', 0)

    // One hover dot per present metric
    const hoverDots = presentKeys.map((key) => ({
      key,
      dot: svg
        .append('circle')
        .attr('r', 5)
        .attr('fill', COLORS[key])
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('opacity', 0),
    }))

    function moveHover(localX: number, pageX: number, pageY: number) {
      const distanceAtMouse = xScale.invert(localX)
      const nearest = data.reduce((a, b) =>
        Math.abs(a.distanceKm - distanceAtMouse) <
        Math.abs(b.distanceKm - distanceAtMouse)
          ? a
          : b
      )

      const cx = xScale(nearest.distanceKm)
      hoverLine.attr('x1', cx).attr('x2', cx).style('opacity', 1)

      hoverDots.forEach(({ key, dot }) => {
        const value = nearest[key]
        if (value == null) {
          dot.style('opacity', 0)
          return
        }
        dot.attr('cx', cx).attr('cy', scaleY(key, value)).style('opacity', 1)
      })

      const parts = presentKeys
        .filter((key) => nearest[key] != null)
        .map(
          (key) =>
            `<strong style="color:${COLORS[key]}">${LEGEND[key]} ${formatValue[key](nearest[key] as number)}</strong>`
        )
      parts.push(`📏 ${nearest.distanceKm} km`)

      tooltip
        .style('opacity', 1)
        .html(parts.join('<br/>'))
        .style('left', `${pageX}px`)
        .style('top', `${pageY - 16}px`)
    }

    function hideHover() {
      hoverLine.style('opacity', 0)
      hoverDots.forEach(({ dot }) => dot.style('opacity', 0))
      tooltip.style('opacity', 0)
    }

    // Mouse / touch capture area
    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mousemove', (event) => {
        const [mouseX] = d3.pointer(event)
        moveHover(mouseX, event.pageX, event.pageY)
      })
      .on('mouseleave', hideHover)
      .on(
        'touchstart',
        (event) => {
          event.preventDefault()
        },
        { passive: false }
      )
      .on('touchmove', (event) => {
        event.preventDefault()
        const [mouseX] = d3.pointer(event.touches[0], event.currentTarget)
        moveHover(mouseX, event.touches[0].pageX, event.touches[0].pageY)
      })
      .on('touchend touchcancel', hideHover)

    return () => {
      tooltip.remove()
    }
    // dataSignature captures every drawn value, so `data` is covered by it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dataSignature,
    containerWidth,
    departureTime?.getTime() ?? 0,
    speedKmh ?? 0,
  ])

  if (data.length === 0) return null

  return <svg ref={svgRef} style={{ width: '100%', display: 'block' }} />
}
