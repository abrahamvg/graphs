"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGraphs = void 0;
const rest_1 = require("@octokit/rest");
const slugify_1 = __importDefault(require("@sindresorhus/slugify"));
const chartjs_node_canvas_1 = require("chartjs-node-canvas");
const dayjs_1 = __importDefault(require("dayjs"));
const fs_extra_1 = require("fs-extra");
const js_yaml_1 = require("js-yaml");
const path_1 = require("path");
const canvasRenderService = new chartjs_node_canvas_1.ChartJSNodeCanvas({ width: 600, height: 400 });
/** Get commits for a history file */
const getHistoryItems = async (octokit, owner, repo, slug, page) => {
    console.log("Fetching history - page", 1);
    const results = await octokit.repos.listCommits({
        owner,
        repo,
        path: `history/${slug}.yml`,
        per_page: 100,
        page,
    });
    let data = results.data;
    if (data.length === 100 &&
        !(0, dayjs_1.default)(data[0]?.commit?.author?.date).isBefore((0, dayjs_1.default)().subtract(1, "year")))
        data.push(...(await getHistoryItems(octokit, owner, repo, slug, page + 1)));
    return data;
};
const getUptimeColor = (uptime) => uptime > 95
    ? "brightgreen"
    : uptime > 90
        ? "green"
        : uptime > 85
            ? "yellowgreen"
            : uptime > 80
                ? "yellow"
                : uptime > 75
                    ? "orange"
                    : "red";
const getResponseTimeColor = (responseTime) => responseTime === 0
    ? "red"
    : responseTime < 200
        ? "brightgreen"
        : responseTime < 400
            ? "green"
            : responseTime < 600
                ? "yellowgreen"
                : responseTime < 800
                    ? "yellow"
                    : responseTime < 1000
                        ? "orange"
                        : "red";
const generateGraphs = async () => {
    const config = (0, js_yaml_1.load)(await (0, fs_extra_1.readFile)((0, path_1.join)(".", ".upptimerc.yml"), "utf8"));
    const owner = config.owner;
    const repo = config.repo;
    const octokit = new rest_1.Octokit({
        auth: config.PAT || process.env.GH_PAT || process.env.GITHUB_TOKEN,
        userAgent: config.userAgent || process.env.USER_AGENT || "KojBot",
    });
    await (0, fs_extra_1.ensureDir)((0, path_1.join)(".", "graphs"));
    if(config.sites)
    for await (const site of config.sites) {
        const slug = site.slug ? site.slug : (0, slugify_1.default)(site.name);
        if (!slug)
            continue;
        let uptime = 0;
        let uptimeDay = 0;
        let uptimeWeek = 0;
        let uptimeMonth = 0;
        let uptimeYear = 0;
        let responseTime = 0;
        let timeDay = 0;
        let timeWeek = 0;
        let timeMonth = 0;
        let timeYear = 0;
        try {
            const api = await (0, fs_extra_1.readJson)((0, path_1.join)(".", "history", "summary.json"));
            const item = api.find((site) => site.slug === slug);
            if (item) {
                uptime = parseFloat(item.uptime);
                uptimeDay = parseFloat(item.uptimeDay || "0");
                uptimeWeek = parseFloat(item.uptimeWeek || "0");
                uptimeMonth = parseFloat(item.uptimeMonth || "0");
                uptimeYear = parseFloat(item.uptimeYear || "0");
                responseTime = item.time;
                timeDay = item.timeDay || 0;
                timeWeek = item.timeWeek || 0;
                timeMonth = item.timeMonth || 0;
                timeYear = item.timeYear || 0;
            }
        }
        catch (error) { }
        await (0, fs_extra_1.ensureDir)((0, path_1.join)(".", "api", slug));
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "uptime.json"), {
            schemaVersion: 1,
            label: "uptime",
            message: `${uptime}%`,
            color: getUptimeColor(uptime),
        });
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "uptime-day.json"), {
            schemaVersion: 1,
            label: "uptime 24h",
            message: `${uptimeDay}%`,
            color: getUptimeColor(uptimeDay),
        });
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "uptime-week.json"), {
            schemaVersion: 1,
            label: "uptime 7d",
            message: `${uptimeWeek}%`,
            color: getUptimeColor(uptimeWeek),
        });
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "uptime-month.json"), {
            schemaVersion: 1,
            label: "uptime 30d",
            message: `${uptimeMonth}%`,
            color: getUptimeColor(uptimeMonth),
        });
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "uptime-year.json"), {
            schemaVersion: 1,
            label: "uptime 1y",
            message: `${uptimeYear}%`,
            color: getUptimeColor(uptimeYear),
        });
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "response-time.json"), {
            schemaVersion: 1,
            label: "response time",
            message: `${responseTime} ms`,
            color: getResponseTimeColor(responseTime),
        });
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "response-time-day.json"), {
            schemaVersion: 1,
            label: "response time 24h",
            message: `${timeDay} ms`,
            color: getResponseTimeColor(timeDay),
        });
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "response-time-week.json"), {
            schemaVersion: 1,
            label: "response time 7d",
            message: `${timeWeek} ms`,
            color: getResponseTimeColor(timeWeek),
        });
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "response-time-month.json"), {
            schemaVersion: 1,
            label: "response time 30d",
            message: `${timeMonth} ms`,
            color: getResponseTimeColor(timeMonth),
        });
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "response-time-year.json"), {
            schemaVersion: 1,
            label: "response time 1y",
            message: `${timeYear} ms`,
            color: getResponseTimeColor(timeYear),
        });
        const items = await getHistoryItems(octokit, owner, repo, slug, 1);
        const responseTimes = items
            .filter((item) => item.commit.message.includes(" in ") &&
            Number(item.commit.message.split(" in ")[1].split("ms")[0].trim()) !== 0 &&
            !isNaN(Number(item.commit.message.split(" in ")[1].split("ms")[0].trim())))
            /**
             * Parse the commit message
             * @example "🟥 Broken Site is down (500 in 321 ms) [skip ci] [upptime]"
             * @returns [Date, 321] where Date is the commit date
             */
            .map((item) => [
            item?.commit?.author?.date,
            parseInt(item.commit.message.split(" in ")[1].split("ms")[0].trim()),
        ])
            .filter((item) => item[1] && !isNaN(item[1]));
        const tDay = responseTimes.filter((i) => (0, dayjs_1.default)(i[0]).isAfter((0, dayjs_1.default)().subtract(1, "day")));
        const tWeek = responseTimes.filter((i) => (0, dayjs_1.default)(i[0]).isAfter((0, dayjs_1.default)().subtract(1, "week")));
        const tMonth = responseTimes.filter((i) => (0, dayjs_1.default)(i[0]).isAfter((0, dayjs_1.default)().subtract(1, "month")));
        const tYear = responseTimes.filter((i) => (0, dayjs_1.default)(i[0]).isAfter((0, dayjs_1.default)().subtract(1, "year")));
        const dataItems = [
            [`${slug}/response-time-day.png`, tDay],
            [`${slug}/response-time-week.png`, tWeek],
            [`${slug}/response-time-month.png`, tMonth],
            [`${slug}/response-time-year.png`, tYear],
        ];
        for await (const dataItem of dataItems) {
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(".", "graphs", dataItem[0]));
            await (0, fs_extra_1.writeFile)((0, path_1.join)(".", "graphs", dataItem[0]), await canvasRenderService.renderToBuffer({
                type: "line",
                data: {
                    labels: [1, ...dataItem[1].map((item) => item[0]).reverse()],
                    datasets: [
                        {
                            backgroundColor: "#89e0cf",
                            borderColor: "#1abc9c",
                            data: [1, ...dataItem[1].map((item) => item[1]).reverse()],
                        },
                    ],
                },
                options: {
                    legend: { display: false },
                    scales: {
                        xAxes: [
                            {
                                display: false,
                                gridLines: {
                                    display: false,
                                },
                            },
                        ],
                        yAxes: [
                            {
                                display: false,
                                gridLines: {
                                    display: false,
                                },
                            },
                        ],
                    },
                },
            }));
        }
        await (0, fs_extra_1.ensureFile)((0, path_1.join)(".", "graphs", slug, "response-time.png"));
        await (0, fs_extra_1.writeFile)((0, path_1.join)(".", "graphs", slug, "response-time.png"), await canvasRenderService.renderToBuffer({
            type: "line",
            data: {
                labels: [1, ...responseTimes.map((item) => item[0]).reverse()],
                datasets: [
                    {
                        backgroundColor: "#89e0cf",
                        borderColor: "#1abc9c",
                        data: [1, ...responseTimes.map((item) => item[1]).reverse()],
                    },
                ],
            },
            options: {
                legend: { display: false },
                scales: {
                    xAxes: [
                        {
                            display: false,
                            gridLines: {
                                display: false,
                            },
                        },
                    ],
                    yAxes: [
                        {
                            display: false,
                            gridLines: {
                                display: false,
                            },
                        },
                    ],
                },
            },
        }));
    }
    if(config.dirs)
    for await (const dir of config.dirs) {
        const slug = dir.slug ? dir.slug : (0, slugify_1.default)(dir.name);
        if (!slug)
            continue;
        let uptime = 0;
        let uptimeDay = 0;
        let uptimeWeek = 0;
        let uptimeMonth = 0;
        let uptimeYear = 0;
        let responseTime = 0;
        let timeDay = 0;
        let timeWeek = 0;
        let timeMonth = 0;
        let timeYear = 0;
        try {
            const api = await (0, fs_extra_1.readJson)((0, path_1.join)(".", "history", "summary.json"));
            const item = api.find((dir) => dir.slug === slug);
            if (item) {
                uptime = parseFloat(item.uptime);
                uptimeDay = parseFloat(item.uptimeDay || "0");
                uptimeWeek = parseFloat(item.uptimeWeek || "0");
                uptimeMonth = parseFloat(item.uptimeMonth || "0");
                uptimeYear = parseFloat(item.uptimeYear || "0");
                responseTime = item.time;
                timeDay = item.timeDay || 0;
                timeWeek = item.timeWeek || 0;
                timeMonth = item.timeMonth || 0;
                timeYear = item.timeYear || 0;
            }
        }
        catch (error) { }
        await (0, fs_extra_1.ensureDir)((0, path_1.join)(".", "api", slug));
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "uptime.json"), {
            schemaVersion: 1,
            label: "uptime",
            message: `${uptime}%`,
            color: getUptimeColor(uptime),
        });
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "uptime-day.json"), {
            schemaVersion: 1,
            label: "uptime 24h",
            message: `${uptimeDay}%`,
            color: getUptimeColor(uptimeDay),
        });
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "uptime-week.json"), {
            schemaVersion: 1,
            label: "uptime 7d",
            message: `${uptimeWeek}%`,
            color: getUptimeColor(uptimeWeek),
        });
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "uptime-month.json"), {
            schemaVersion: 1,
            label: "uptime 30d",
            message: `${uptimeMonth}%`,
            color: getUptimeColor(uptimeMonth),
        });
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "uptime-year.json"), {
            schemaVersion: 1,
            label: "uptime 1y",
            message: `${uptimeYear}%`,
            color: getUptimeColor(uptimeYear),
        });
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "response-time.json"), {
            schemaVersion: 1,
            label: "response time",
            message: `${responseTime} ms`,
            color: getResponseTimeColor(responseTime),
        });
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "response-time-day.json"), {
            schemaVersion: 1,
            label: "response time 24h",
            message: `${timeDay} ms`,
            color: getResponseTimeColor(timeDay),
        });
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "response-time-week.json"), {
            schemaVersion: 1,
            label: "response time 7d",
            message: `${timeWeek} ms`,
            color: getResponseTimeColor(timeWeek),
        });
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "response-time-month.json"), {
            schemaVersion: 1,
            label: "response time 30d",
            message: `${timeMonth} ms`,
            color: getResponseTimeColor(timeMonth),
        });
        await (0, fs_extra_1.writeJson)((0, path_1.join)(".", "api", slug, "response-time-year.json"), {
            schemaVersion: 1,
            label: "response time 1y",
            message: `${timeYear} ms`,
            color: getResponseTimeColor(timeYear),
        });
        const items = await getHistoryItems(octokit, owner, repo, slug, 1);
        const responseTimes = items
            .filter((item) => item.commit.message.includes("(Status : ") &&
            Number(item.commit.message.split("[Code : ")[1].split("] ")[0].trim()) >= -1 &&
            Number(item.commit.message.split("[Code : ")[1].split("] ")[0].trim()) <= 1 &&
            !isNaN(Number(item.commit.message.split("[Code : ")[1].split("] ")[0].trim())))
            /**
             * Parse the commit message
             * @example "🟥 Broken Site is down (500 in 321 ms) [skip ci] [upptime]"
             * @returns [Date, 321] where Date is the commit date
             */
            .map((item) => [
            (item.commit.author || {}).date,
            parseInt(item.commit.message.split("[Code : ")[1].split("] ")[0].trim()),
        ])
            .filter((item) => item[1] && !isNaN(item[1]));
        const tDay = responseTimes.filter((i) => (0, dayjs_1.default)(i[0]).isAfter((0, dayjs_1.default)().subtract(1, "day")));
        const tWeek = responseTimes.filter((i) => (0, dayjs_1.default)(i[0]).isAfter((0, dayjs_1.default)().subtract(1, "week")));
        const tMonth = responseTimes.filter((i) => (0, dayjs_1.default)(i[0]).isAfter((0, dayjs_1.default)().subtract(1, "month")));
        const tYear = responseTimes.filter((i) => (0, dayjs_1.default)(i[0]).isAfter((0, dayjs_1.default)().subtract(1, "year")));
        const dataItems = [
            [`${slug}/response-time-day.png`, tDay],
            [`${slug}/response-time-week.png`, tWeek],
            [`${slug}/response-time-month.png`, tMonth],
            [`${slug}/response-time-year.png`, tYear],
        ];
        for await (const dataItem of dataItems) {
            await (0, fs_extra_1.ensureFile)((0, path_1.join)(".", "graphs", dataItem[0]));
            await (0, fs_extra_1.writeFile)((0, path_1.join)(".", "graphs", dataItem[0]), await canvasRenderService.renderToBuffer({
                type: "line",
                data: {
                    labels: [1, ...dataItem[1].map((item) => item[0]).reverse()],
                    datasets: [
                        {
                            backgroundColor: "#89e0cf",
                            borderColor: "#1abc9c",
                            data: [1, ...dataItem[1].map((item) => item[1]).reverse()],
                        },
                    ],
                },
                options: {
                    legend: { display: false },
                    scales: {
                        xAxes: [
                            {
                                display: false,
                                gridLines: {
                                    display: false,
                                },
                            },
                        ],
                        yAxes: [
                            {
                                display: false,
                                gridLines: {
                                    display: false,
                                },
                            },
                        ],
                    },
                },
            }));
        }
        await (0, fs_extra_1.ensureFile)((0, path_1.join)(".", "graphs", slug, "response-time.png"));
        await (0, fs_extra_1.writeFile)((0, path_1.join)(".", "graphs", slug, "response-time.png"), await canvasRenderService.renderToBuffer({
            type: "line",
            data: {
                labels: [1, ...responseTimes.map((item) => item[0]).reverse()],
                datasets: [
                    {
                        backgroundColor: "#89e0cf",
                        borderColor: "#1abc9c",
                        data: [1, ...responseTimes.map((item) => item[1]).reverse()],
                    },
                ],
            },
            options: {
                legend: { display: false },
                scales: {
                    xAxes: [
                        {
                            display: false,
                            gridLines: {
                                display: false,
                            },
                        },
                    ],
                    yAxes: [
                        {
                            display: false,
                            gridLines: {
                                display: false,
                            },
                        },
                    ],
                },
            },
        }));
    }
};
exports.generateGraphs = generateGraphs;
//# sourceMappingURL=index.js.map
