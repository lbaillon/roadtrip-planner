import * as d3 from 'd3'
import type { GpxCoordinate } from '@roadtrip/shared'
import { haversineDistanceKm } from '#web/lib/gpx-utils'
import { useEffect, useRef } from 'react'

interface ElevationChartProps {
  coordinates: GpxCoordinate[]
}

interface EnrichedPoint {
  ele: number
  distanceKm: number
}

export function ElevationChart({ coordinates }: ElevationChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  function getElevationData() {
    if (coordinates.length === 0) return []
    let cumulatedDistance = 0

    const pointsWithElevation = coordinates
      .map((coord, i) => {
        if (i > 0) {
          cumulatedDistance += haversineDistanceKm(coordinates[i - 1], coord)
        }
        return {
          distanceKm: parseFloat(cumulatedDistance.toFixed(2)),
          ele: coord.ele,
        }
      })
      .filter((point): point is EnrichedPoint => point.ele != null)

    return pointsWithElevation
  }

  const data = getElevationData()

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const margin = { top: 24, right: 24, bottom: 52, left: 56 }
    const width = svgRef.current.clientWidth - margin.left - margin.right
    const height = 280 - margin.top - margin.bottom

    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3
      .select(svgRef.current)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.distanceKm) ?? 0])
      .range([0, width])

    const eleMin = d3.min(data, (d) => d.ele) ?? 0
    const eleMax = d3.max(data, (d) => d.ele) ?? 0

    const yScale = d3
      .scaleLinear()
      .domain([Math.max(0, eleMin - 50), eleMax + 50])
      .range([height, 0])

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

    // Axes
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickFormat((d) => `${d} km`)
      )
      .call((g) => g.select('.domain').attr('stroke', '#cbd5e1'))
      .call((g) => g.selectAll('.tick line').attr('stroke', '#cbd5e1'))
      .call((g) =>
        g
          .selectAll('.tick text')
          .attr('fill', '#64748b')
          .attr('font-size', '11px')
      )

    svg
      .append('g')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => `${d} m`)
      )
      .call((g) => g.select('.domain').attr('stroke', '#cbd5e1'))
      .call((g) => g.selectAll('.tick line').attr('stroke', '#cbd5e1'))
      .call((g) =>
        g
          .selectAll('.tick text')
          .attr('fill', '#64748b')
          .attr('font-size', '11px')
      )

    // Axis labels
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height + 44)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '12px')
      .text('Distance (km)')

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -46)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '12px')
      .text('Altitude (m)')

    // Gradient fill under the curve
    const defs = svg.append('defs')

    const gradient = defs
      .append('linearGradient')
      .attr('id', 'elevationGradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', height)

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#16a34a')
      .attr('stop-opacity', 0.3)

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#16a34a')
      .attr('stop-opacity', 0.02)

    // Area under the curve
    const area = d3
      .area<EnrichedPoint>()
      .x((d) => xScale(d.distanceKm))
      .y0(height)
      .y1((d) => yScale(d.ele))
      .curve(d3.curveCatmullRom.alpha(0.5))

    svg
      .append('path')
      .datum(data)
      .attr('fill', 'url(#elevationGradient)')
      .attr('d', area)

    // Main line
    const line = d3
      .line<EnrichedPoint>()
      .x((d) => xScale(d.distanceKm))
      .y((d) => yScale(d.ele))
      .curve(d3.curveCatmullRom.alpha(0.5))

    svg
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#16a34a')
      .attr('stroke-width', 2)
      .attr('d', line)

    // Tooltip
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
      .style('transition', 'opacity 0.15s ease')

    // Vertical hover line
    const hoverLine = svg
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,3')
      .attr('y1', 0)
      .attr('y2', height)
      .style('opacity', 0)

    // Hover dot
    const hoverDot = svg
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#16a34a')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('opacity', 0)

    // Mouse event capture area
    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mousemove', (event) => {
        const [mouseX] = d3.pointer(event)
        const distanceAtMouse = xScale.invert(mouseX)

        const nearest = data.reduce((a, b) =>
          Math.abs(a.distanceKm - distanceAtMouse) <
          Math.abs(b.distanceKm - distanceAtMouse)
            ? a
            : b
        )

        const cx = xScale(nearest.distanceKm)
        const cy = yScale(nearest.ele)

        hoverLine.attr('x1', cx).attr('x2', cx).style('opacity', 1)
        hoverDot.attr('cx', cx).attr('cy', cy).style('opacity', 1)

        tooltip
          .style('opacity', 1)
          .html(
            `<strong style="color:#16a34a">⛰️ ${Math.round(nearest.ele)} m</strong><br/>
          📏 ${nearest.distanceKm} km`
          )
          .style('left', `${event.pageX + 14}px`)
          .style('top', `${event.pageY - 48}px`)
      })
      .on('mouseleave', () => {
        hoverLine.style('opacity', 0)
        hoverDot.style('opacity', 0)
        tooltip.style('opacity', 0)
      })

    return () => {
      tooltip.remove()
    }
  }, [data])

  if (data.length === 0) return null

  return <svg ref={svgRef} style={{ width: '100%', display: 'block' }} />
}
