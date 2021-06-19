#!/usr/bin/env node
'use strict';
import * as Bossy from "bossy";
import * as Lib from "../lib";
import * as Path from "path";

const now = new Date();
const oneYearFromNow = new Date();

oneYearFromNow.setFullYear(now.getFullYear() + 1);

const cliArgs = {
    'd': {
        description: 'Input LTS JSON file',
        alias: 'data',
        type: 'string',
        require: false,
        multiple: false,
        default: 'lts.json'
    },
    's': {
        description: 'Query start date',
        alias: 'start',
        type: 'string',
        require: false,
        multiple: false,
        default: now
    },
    'e': {
        description: 'Query end date',
        alias: 'end',
        type: 'string',
        require: false,
        multiple: false,
        default: oneYearFromNow
    },
    'h': {
        description: 'HTML output file',
        alias: 'html',
        type: 'string',
        require: false,
        multiple: false,
        default: null
    },
    'g': {
        description: 'SVG output file',
        alias: 'svg',
        type: 'string',
        require: false,
        multiple: false,
        default: null
    },
    'p': {
        description: 'PNG output file',
        alias: 'png',
        type: 'string',
        require: false,
        multiple: false,
        default: null
    },
    'a': {
        description: 'Animate bars on load',
        alias: 'animate',
        type: 'boolean',
        require: false,
        multiple: false,
        default: false
    },
    'awdjwoadkad': {
        alias: 'picWidth',
        type: 'number',
        require: false,
        multiple: false,
        default: null
    },
    'awdada': {
        alias: 'picHeight',
        type: 'number',
        require: false,
        multiple: false,
        default: null
    },
    'm': {
        description: 'Exclude Master (unstable) in graph',
        alias: 'excludeMaster',
        type: 'boolean',
        require: false,
        multiple: false,
        default: false
    },
    'dawdwaev124ve1': {
        alias: 'marginLeft',
        type: 'number',
        require: false,
        multiple: false,
        default: 320
    },
};

const args = Bossy.parse(cliArgs, {argv: process.argv});

if (args instanceof Error) {
    Bossy.usage(cliArgs, args.message);
    process.exit(1);
}

const options: Lib.CreateParams = {
    data: require(Path.resolve(__dirname, '..', args.data)),
    queryStart: new Date(args.start),
    queryEnd: new Date(args.end),
    html: args.html ? Path.resolve(args.html) : null,
    svg: args.svg ? Path.resolve(args.svg) : null,
    png: args.png ? Path.resolve(args.png) : null,
    animate: args.animate,
    picWidth: args.picWidth,
    picHeight: args.picHeight,
    excludeMaster: args.excludeMaster,
    marginLeft: args.marginLeft
};

Lib.create(options);
