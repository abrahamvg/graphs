#!/usr/bin/env node
import { generateGraphs } from "./";
import 'dotenv/config';

const cli = async () => {
  return generateGraphs();
};

cli();
