'use strict';
import * as Fs from "fs";
import * as D3 from "d3";
import * as D3Node from "d3-node";

const styles = `
.active {
  fill: #2aa748;
}
.lts {
  fill: #47b4ff;
}
.supported {
  fill: #89a19d;
}
.unstables {
  fill: #805D03;
}
.bar-join {
  fill: #ffffff;
}
.bar {
  filter: drop-shadow( 0px 0px 4px rgba(100, 100, 111, 87.3));
}
 /*.bar-join.unstable, .bar-join.active {*/
 /*  display: none;*/
 /*}*/
.tick text {
  font-size: 36px;
  /*font-family: 'Balsamiq Sans', cursive;*/
  /*font-family: 'Comfortaa', cursive;*/
  /*font-family: 'Lato', sans-serif;*/
  font-family: 'Inter', sans-serif;
  /*font-family: 'Montserrat', sans-serif;*/
  /*font-family: 'Exo 2', sans-serif;*/
  /*font-weight: 300;*/
  font-weight: 400;
  /*fill: #89a19d;*/
  /*stroke: #89a19d;*/
  fill: black;
  stroke: black;
}
.axis--y .tick text {
  text-anchor: end;
}
.label {
  font-size: 36px;
  // font-family: 'Comfortaa', cursive;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  text-anchor: start;
  dominant-baseline: middle;
  fill: white;
  stroke: white;
}
`;

interface Version {
    unstable_start?: string;
    start?: string;
    lts?: string;
    supported?: string;
    end?: string;
}

interface VersionBar {
    name: string;
    type: string;
    start: Date;
    end: Date;
    hidebar: boolean;
}

function parseInput(
    data: { [versionName: string]: Version },
    queryStart: Date,
    queryEnd: Date,
    excludeMaster: boolean
): VersionBar[] {
    const output: VersionBar[] = [];

    Object.keys(data).forEach((v) => {
        const version = data[v];
        const name = `${v.replace('v', '')}   `;
        const unstable_start = version.unstable_start ? new Date(version.unstable_start) : null;
        const active = version.start ? new Date(version.start) : null;
        const lts = version.lts ? new Date(version.lts) : null;
        const maint = version.supported ? new Date(version.supported) : null;
        let end = version.end ? new Date(version.end) : null;

        if (unstable_start !== null) {
            if (active === null) output.push({name, type: 'unstables', start: unstable_start, end, hidebar: true});
            else output.push({name, type: 'unstables', start: unstable_start, end: active, hidebar: true});
        } else if (active === null) {
            throw new Error(`missing start in ${version}`);
        }

        if (end === null) {
            throw new Error(`missing end in ${version}`);
        }
        
        let toAdd: VersionBar

        if (maint !== null) {
            if (maint < queryEnd && end > queryStart) {
                toAdd = {name, type: 'supported', start: maint, end, hidebar: false};
            }

            end = maint;
        }

        if (lts !== null) {
            if (lts < queryEnd && end > queryStart) {
                output.push({name, type: 'lts', start: lts, end, hidebar: false});
            }

            end = lts;
        }

        if (active !== null && active < queryEnd && end > queryStart) {
            output.push({name, type: 'active', start: active, end, hidebar: unstable_start === null});
        }
        
        if (toAdd) {
            output.push(toAdd)
        }
    });

    if (!excludeMaster) {
        output.unshift({
            name: 'Master',
            type: 'unstable',
            start: queryStart,
            end: queryEnd,
            hidebar: false
        });
    }

    return output;
}

export interface Margin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface CreateParams {
    data: { [version: string]: Version };
    queryStart: Date;
    queryEnd: Date;
    html?: string;
    svg?: string;
    png?: string;
    animate?: boolean;
    excludeMaster?: boolean;
    picWidth?: number;
    picHeight?: number;
    margin?: Margin;
    marginLeft?: number
}

export function create(options: CreateParams) {
    const data = parseInput(options.data, options.queryStart, options.queryEnd, options.excludeMaster);
    const d3n = new D3Node({svgStyles: styles, d3Module: D3});
    const margin = options.margin || {top: 100, right: 30, bottom: 30, left: options.marginLeft};
    const width = options.picWidth - margin.left - margin.right;
    const height = options.picHeight - margin.top - margin.bottom;
    const xScale = D3.scaleTime()
        .domain([options.queryStart, options.queryEnd])
        .range([0, width])
        .clamp(true);
    const yScale = D3.scaleBand()
        .domain(data.map((data) => {
            return data.name;
        }))
        .range([0, height])
        .padding(0.3);
    const xAxis = D3.axisBottom(xScale)
        .tickSize(height)
        .tickFormat(D3.timeFormat('%b %Y'));
    const yAxis = D3.axisRight(yScale).tickSize(width);
    const svg = d3n.createSVG()
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('id', 'bar-container')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);


    function calculateWidth(data: VersionBar) {
        return xScale(data.end) - xScale(data.start);
    }

    function calculateHeight(data: VersionBar) {
        return yScale.bandwidth();
    }

    function customXAxis(g) {
        g.call(xAxis);
        g.select('.domain').remove();
        g.selectAll('.tick line').attr('stroke', '#000000').attr("stroke-width", 2);
        g.selectAll('.tick text').attr('y', 0).attr('dy', -10);
    }

    function customYAxis(g) {
        g.call(yAxis);
        g.select('.domain').remove();
        // g.selectAll('.tick line').attr('stroke', '#e1e7e7');
        g.selectAll('.tick line').attr('stroke', '#000000').attr("stroke-width", 2);
        g.selectAll('.tick text').attr('x', 0).attr('dx', -10);
        g.append('line')
            .attr('y1', height)
            .attr('y2', height)
            .attr('x2', width)
            .attr('stroke', '#000000')
            .attr("stroke-width", 3);
        // .attr('stroke', '#89a19d');
    }

    svg.append('g')
        .attr('class', 'axis axis--x')
        .call(customXAxis);

    svg.append('g')
        .attr('class', 'axis axis--y')
        .call(customYAxis);

    const bar = svg.selectAll('#bar-container').data(data).enter().append('g');

    const rect = bar.append('rect')
        .attr('class', (data: VersionBar) => {
            return `bar ${data.type}`;
        })
        .attr('x', (data: VersionBar) => {
            return xScale(data.start);
        })
        .attr('y', (data: VersionBar) => {
            return yScale(data.name);
        })
        .attr('width', calculateWidth)
        .attr('height', calculateHeight);

    if (options.animate === true) {
        rect.append('animate')
            .attr('attributeName', 'width')
            .attr('from', 0)
            .attr('to', calculateWidth)
            .attr('dur', '1s');
    }

    bar.append('rect')
        .attr('class', (data) => {
            return `bar-join ${data.type}`;
        })
        .attr('x', (data: VersionBar) => {
            return xScale(data.start);
        })
        .attr('y', (data: VersionBar) => {
            return yScale(data.name);
        })
        .attr('width', 4)
        .attr('height', calculateHeight)
        .style('opacity', (data: VersionBar) => {
            // Hack to hide on active and unstable
            if (data.hidebar ||
                xScale(data.start) <= 0) {
                return 0;
            }

            return 1;
        });

    bar.append('text')
        .attr('class', 'label')
        .attr('x', (data: VersionBar) => {
            return xScale(data.start) + 20;
        })
        .attr('y', (data: VersionBar) => {
            // + 2 is a small correction so the text fill is more centered.
            return yScale(data.name) + (calculateHeight(data) / 2) + 4;
        })
        .text((data: VersionBar) => {
            if (data.type === 'lts') return "LTS"
            if (data.type === 'unstables') return "unstable"
            return data.type;
        })
        .style('opacity', (data: VersionBar) => {
            // Hack to deal with overflow text.
            const min = data.type.length * 20;
            return +(calculateWidth(data) >= min);
        });

    if (options.html) {
        Fs.writeFileSync(options.html, d3n.html());
    }

    if (options.svg) {
        Fs.writeFileSync(options.svg, d3n.svgString());
    }

    if (options.png) {
        const Svg2png = require('svg2png'); // Load this lazily.

        Fs.writeFileSync(options.png, Svg2png.sync(Buffer.from(d3n.svgString())));
    }
}
