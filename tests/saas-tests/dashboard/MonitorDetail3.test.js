const puppeteer = require('puppeteer');
const utils = require('../../test-utils');
const init = require('../../test-init');

require('should');
let browser, page;
// user credentials
const email = utils.generateRandomBusinessEmail();
const password = '1234567890';
const monitorName = utils.generateRandomString();
const newMonitorName = utils.generateRandomString();
const urlMonitorName = utils.generateRandomString();
const componentName = utils.generateRandomString();
const subscriberEmail = utils.generateRandomBusinessEmail();
const webHookName = utils.generateRandomString();
const newWebHookName = utils.generateRandomString();
const webhookEndpoint = utils.generateRandomWebsite();
const priorityName = utils.generateRandomString();
const incidentTitle = utils.generateRandomString();
const newIncidentTitle = utils.generateRandomString();

describe('Monitor Detail API', () => {
    const operationTimeOut = init.timeout;

    beforeAll(async () => {
        jest.setTimeout(init.timeout);

        browser = await puppeteer.launch(utils.puppeteerLaunchConfig);
        page = await browser.newPage();
        await page.setUserAgent(utils.agent);

        // Register user
        const user = {
            email,
            password,
        };

        // user
        await init.registerUser(user, page);
        // add new monitor to component on parent project
        await init.addMonitorToComponent(componentName, monitorName, page);
        await init.addIncidentPriority(priorityName, page);
    });

    afterAll(async done => {
        await browser.close();
        done();
    });    

    test(
        'Should navigate to monitor details and create a slack webhook',
        async done => {
            // Navigate to Monitor details
            await init.navigateToMonitorDetails(
                componentName,
                monitorName,
                page
            );
            // click on integrations tab
            await init.pageClick(page, '.integrations-tab');

            const addButtonSelector = '#addSlackButton';
            await init.pageWaitForSelector(page, addButtonSelector);
            await init.page$Eval(page, addButtonSelector, e => e.click());

            await init.pageWaitForSelector(page, '#endpoint');

            await init.pageType(page, '#webHookName', webHookName);
            await init.pageType(page, '#endpoint', webhookEndpoint);

            await page.evaluate(() => {
                document.querySelector('input[name=incidentCreated]').click();
            });

            //Only the NAME is rendered as well as the ACTIONS to be performed.
            const createdWebhookSelector = `#name_slack_${webHookName}`;

            await init.page$Eval(page, '#createSlack', e => e.click());
            await init.pageWaitForSelector(page, '#createSlack', {
                hidden: true,
            });
            await init.pageWaitForSelector(page, createdWebhookSelector);

            const createdWebhookName = await init.page$Eval(
                page,
                createdWebhookSelector,
                el => el.textContent
            );
            expect(createdWebhookName).toEqual(webHookName);
            done();
        },
        operationTimeOut
    );

    test(
        'Should navigate to monitor details and update a Slack webhook',
        async done => {
            // Navigate to Monitor details
            await init.navigateToMonitorDetails(
                componentName,
                monitorName,
                page
            );
            // click on integrations tab
            await init.pageClick(page, '.integrations-tab');

            const existingWebhookSelector = `#name_slack_${webHookName}`;

            await init.pageWaitForSelector(page, existingWebhookSelector);

            const existingWebhookName = await init.page$Eval(
                page,
                existingWebhookSelector,
                el => el.textContent
            );

            expect(existingWebhookName).toEqual(webHookName);

            const editWebhookButtonSelector = `#edit_slack_${webHookName}`;
            await init.page$Eval(page, editWebhookButtonSelector, e =>
                e.click()
            );

            const newWebhookEndpoint = utils.generateRandomWebsite();
            await init.pageClick(page, '#webHookName');
            await init.pageType(page, '#webHookName', newWebHookName);
            await init.pageClick(page, '#endpoint');
            await init.pageType(page, '#endpoint', newWebhookEndpoint);
            await init.page$Eval(page, '#slackUpdate', e => e.click());
            await init.pageWaitForSelector(page, '#slackUpdate', {
                hidden: true,
            });
            await init.pageWaitForSelector(
                page,
                `#name_slack_${newWebHookName}`
            );
            const updatedWebhookName = await init.page$Eval(
                page,
                `#name_slack_${newWebHookName}`,
                el => el.textContent
            );
            expect(updatedWebhookName).toEqual(newWebHookName);
            done();
        },
        operationTimeOut
    );

    test(
        'Should navigate to monitor details and delete a slack webhook',
        async done => {
            // Navigate to Monitor details
            await init.navigateToMonitorDetails(
                componentName,
                monitorName,
                page
            );
            // click on integrations tab
            await init.pageClick(page, '.integrations-tab');
            const createdWebhookSelector = '.slack-list';
            await init.pageWaitForSelector(page, createdWebhookSelector);

            let webhookRows = await init.page$$(page, createdWebhookSelector);
            let countWebhooks = webhookRows.length;

            expect(countWebhooks).toEqual(1);

            const deleteWebhookButtonSelector = `#delete_slack_${newWebHookName}`;
            await init.page$Eval(page, deleteWebhookButtonSelector, e =>
                e.click()
            );

            await init.pageWaitForSelector(page, '#slackDelete');
            await init.page$Eval(page, '#slackDelete', e => e.click());
            await init.pageWaitForSelector(page, '#slackDelete', {
                hidden: true,
            });

            webhookRows = await init.page$$(page, createdWebhookSelector);
            countWebhooks = webhookRows.length;

            expect(countWebhooks).toEqual(0);
            done();
        },
        operationTimeOut
    );

    test(
        'Should navigate to monitor details and get list of slack webhooks and paginate them',
        async done => {
            // Navigate to Monitor details
            await init.navigateToMonitorDetails(
                componentName,
                monitorName,
                page
            );
            // click on integrations tab
            await init.pageClick(page, '.integrations-tab');
            const addButtonSelector = '#addSlackButton';
            await init.pageWaitForSelector(page, addButtonSelector);

            for (let i = 0; i < 11; i++) {
                await init.page$Eval(page, addButtonSelector, e => e.click());
                await init.pageWaitForSelector(page, '#endpoint');

                await init.pageType(
                    page,
                    '#webHookName',
                    utils.generateRandomString()
                );
                await init.pageType(
                    page,
                    '#endpoint',
                    utils.generateRandomWebsite()
                );
                await page.evaluate(() => {
                    document
                        .querySelector('input[name=incidentCreated]')
                        .click();
                });
                await init.page$Eval(page, '#createSlack', e => e.click());
                await init.pageWaitForSelector(page, '#createSlack', {
                    hidden: true,
                });
            }

            await init.navigateToMonitorDetails(
                componentName,
                monitorName,
                page
            );
            await init.pageClick(page, '.integrations-tab');

            const createdWebhookSelector = '.slack-list';
            await init.pageWaitForSelector(page, createdWebhookSelector);

            let webhookRows = await init.page$$(page, createdWebhookSelector);
            let countWebhooks = webhookRows.length;

            expect(countWebhooks).toEqual(10);

            const nextSelector = await init.page$(page, '#btnNextSlack');

            await nextSelector.click();
            await init.pageWaitForSelector(page, '.ball-beat', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageWaitForSelector(page, '.ball-beat', {
                hidden: true,
            });

            await init.pageWaitForSelector(page, createdWebhookSelector);

            webhookRows = await init.page$$(page, createdWebhookSelector);
            countWebhooks = webhookRows.length;

            expect(countWebhooks).toEqual(1);

            const prevSelector = await init.page$(page, '#btnPrevSlack');

            await prevSelector.click();
            await init.pageWaitForSelector(page, '.ball-beat', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageWaitForSelector(page, '.ball-beat', {
                hidden: true,
            });

            await init.pageWaitForSelector(page, createdWebhookSelector);

            webhookRows = await init.page$$(page, createdWebhookSelector);
            countWebhooks = webhookRows.length;

            expect(countWebhooks).toEqual(10);
            done();
        },
        operationTimeOut
    );

    test(
        'Should navigate to monitor details and create a webhook',
        async done => {
            // Navigate to Monitor details
            await init.navigateToMonitorDetails(
                componentName,
                monitorName,
                page
            );
            // click on integrations tab
            await init.pageClick(page, '.integrations-tab');
            const addButtonSelector = '#addWebhookButton';
            await init.pageWaitForSelector(page, addButtonSelector);
            await init.page$Eval(page, addButtonSelector, e => e.click());

            await init.pageWaitForSelector(page, '#endpoint');
            await init.pageType(page, '#endpoint', webhookEndpoint);
            await init.selectDropdownValue('#endpointType', 'GET', page);

            await page.evaluate(() => {
                document.querySelector('input[name=incidentCreated]').click();
            });

            const createdWebhookSelector = '#webhook_name';

            await init.page$Eval(page, '#createWebhook', e => e.click());
            await init.pageWaitForSelector(page, '#createWebhook', {
                hidden: true,
            });
            await init.pageWaitForSelector(page, createdWebhookSelector);

            const createdWebhookEndpoint = await init.page$Eval(
                page,
                createdWebhookSelector,
                el => el.textContent
            );

            expect(createdWebhookEndpoint).toEqual(webhookEndpoint);
            done();
        },
        operationTimeOut
    );

    test(
        'Should navigate to monitor details and get list of webhooks and paginate webhooks',
        async done => {
            // Navigate to Monitor details
            await init.navigateToMonitorDetails(
                componentName,
                monitorName,
                page
            );
            // click on integrations tab
            await init.pageClick(page, '.integrations-tab');

            const addButtonSelector = '#addWebhookButton';
            await init.pageWaitForSelector(page, addButtonSelector);

            for (let i = 0; i < 10; i++) {
                await init.page$Eval(page, addButtonSelector, e => e.click());
                await init.pageWaitForSelector(page, '#endpoint');

                await init.pageType(
                    page,
                    '#endpoint',
                    utils.generateRandomWebsite()
                );
                await init.selectDropdownValue('#endpointType', 'GET', page);
                await page.evaluate(() => {
                    document
                        .querySelector('input[name=incidentCreated]')
                        .click();
                });
                await init.page$Eval(page, '#createWebhook', e => e.click());
                await init.pageWaitForSelector(page, '#createWebhook', {
                    hidden: true,
                });
            }

            await init.navigateToMonitorDetails(
                componentName,
                monitorName,
                page
            );

            // click on integrations tab
            await init.pageClick(page, '.integrations-tab');

            const createdWebhookSelector = '.webhook-list';
            await init.pageWaitForSelector(page, createdWebhookSelector);

            let webhookRows = await init.page$$(page, createdWebhookSelector);
            let countWebhooks = webhookRows.length;

            expect(countWebhooks).toEqual(10);

            await init.pageWaitForSelector(page, '#btnNextWebhook', {
                visible: true,
                timeout: init.timeout,
            });
            await init.page$Eval(page, '#btnNextWebhook', elem => elem.click());
            await init.pageWaitForSelector(page, '.ball-beat', {
                visible: true,
                timeout: init.timeout,
            });
            await init.pageWaitForSelector(page, '.ball-beat', {
                hidden: true,
            });

            await init.pageWaitForSelector(page, createdWebhookSelector);
            webhookRows = await init.page$$(page, createdWebhookSelector);
            countWebhooks = webhookRows.length;
            expect(countWebhooks).toEqual(1);

            await init.pageWaitForSelector(page, '#btnPrevWebhook', {
                visible: true,
                timeout: init.timeout,
            });
            await init.page$Eval(page, '#btnPrevWebhook', elem => elem.click());
            await init.pageWaitForSelector(page, '.ball-beat', {
                hidden: true,
            });
            await init.pageWaitForSelector(page, createdWebhookSelector);

            webhookRows = await init.page$$(page, createdWebhookSelector);
            countWebhooks = webhookRows.length;

            expect(countWebhooks).toEqual(10);
            done();
        },
        operationTimeOut
    );

    // test(
    //     'Should navigate to monitor details and get list of website scans',
    //     async done => {
    //         await init.navigateToComponentDetails(componentName, page);

    //         await init.pageWaitForSelector(page, '#form-new-monitor');
    //         await init.page$Eval(page, 'input[id=name]', e => e.click());
    //         await init.pageType(page, 'input[id=name]', urlMonitorName);
    //         await init.pageClick(page, '[data-testId=type_url]');
    //         await init.pageWaitForSelector(page, '#url', {
    //             visible: true,
    //             timeout: init.timeout,
    //         });
    //         await init.page$Eval(page, '#url', e => e.click());
    //         await init.pageType(page, '#url', 'https://google.com');
    //         await init.page$Eval(page, 'button[type=submit]', e => e.click());
    //         await init.pageWaitForSelector(page, '.ball-beat', {
    //             visible: true,
    //             timeout: init.timeout,
    //         });
    //         await init.pageWaitForSelector(page, '.ball-beat', {
    //             hidden: true,
    //         });

    //         // Navigate to Monitor details
    //         await init.navigateToMonitorDetails(
    //             componentName,
    //             urlMonitorName,
    //             page
    //         );

    //         const createdLighthouseLogsSelector = '.lighthouseLogsListItem';
    //         await init.pageWaitForSelector(
    //             page,
    //             createdLighthouseLogsSelector,
    //             {
    //                 visible: true,
    //                 timeout: 200000,
    //             }
    //         );

    //         const lighthouseLogsRows = await init.page$$(
    //             page,
    //             createdLighthouseLogsSelector
    //         );
    //         const countLighthouseLogs = lighthouseLogsRows.length;

    //         expect(countLighthouseLogs).toEqual(1);
    //         done();
    //     },
    //     operationTimeOut
    // );

    // test(
    //     'Should navigate to monitor details and add new site url',
    //     async done => {
    //         // Navigate to Monitor details
    //         await init.navigateToMonitorDetails(
    //             componentName,
    //             urlMonitorName,
    //             page
    //         );

    //         await init.pageWaitForSelector(
    //             page,
    //             `#addSiteUrl_${urlMonitorName}`
    //         );
    //         await init.page$Eval(page, `#addSiteUrl_${urlMonitorName}`, e =>
    //             e.click()
    //         );

    //         await init.pageWaitForSelector(page, 'input[id=siteUrl]');
    //         await init.pageType(page, 'input[id=siteUrl]', 'https://fyipe.com');
    //         await init.page$Eval(page, '#addSiteUrlButton', e => e.click());
    //         //
    //         await init.pageWaitForSelector(page, '#addSiteUrlButton', {
    //             hidden: true,
    //         });

    //         const createdLighthouseLogsSelector = '.lighthouseLogsListItem';
    //         await init.pageWaitForSelector(page, createdLighthouseLogsSelector);

    //         const lighthouseLogsRows = await init.page$$(
    //             page,
    //             createdLighthouseLogsSelector
    //         );
    //         const countLighthouseLogs = lighthouseLogsRows.length;

    //         expect(countLighthouseLogs).toEqual(2);
    //         done();
    //     },
    //     operationTimeOut
    // );

    // test(
    //     'Should navigate to monitor details and remove site url',
    //     async done => {
    //         // Navigate to Monitor details
    //         await init.navigateToMonitorDetails(
    //             componentName,
    //             urlMonitorName,
    //             page
    //         );

    //         await init.pageWaitForSelector(
    //             page,
    //             `#removeSiteUrl_${urlMonitorName}_0`
    //         );
    //         await init.page$Eval(
    //             page,
    //             `#removeSiteUrl_${urlMonitorName}_0`,
    //             e => e.click()
    //         );
    //         await init.pageWaitForSelector(page, '#websiteUrlDelete');
    //         await init.page$Eval(page, '#websiteUrlDelete', e => e.click());

    //         await init.pageWaitForSelector(page, '#websiteUrlDelete', {
    //             hidden: true,
    //         });

    //         const createdLighthouseLogsSelector = '.lighthouseLogsListItem';
    //         await init.pageWaitForSelector(page, createdLighthouseLogsSelector);

    //         const lighthouseLogsRows = await init.page$$(
    //             page,
    //             createdLighthouseLogsSelector
    //         );
    //         const countLighthouseLogs = lighthouseLogsRows.length;

    //         expect(countLighthouseLogs).toEqual(1);
    //         done();
    //     },
    //     operationTimeOut
    // );

    // test(
    //     'Should navigate to monitor details and trigger website scan',
    //     async done => {
    //         // Navigate to Monitor details
    //         await init.navigateToMonitorDetails(
    //             componentName,
    //             urlMonitorName,
    //             page
    //         );

    //         await init.pageWaitForSelector(
    //             page,
    //             `#scanWebsites_${urlMonitorName}`
    //         );
    //         await init.page$Eval(page, `#scanWebsites_${urlMonitorName}`, e =>
    //             e.click()
    //         );

    //         let lighthousePerformanceElement = await init.pageWaitForSelector(
    //             page,
    //             `#performance_${urlMonitorName}_0`,
    //             { visible: true, timeout: init.timeout }
    //         );
    //         lighthousePerformanceElement = await lighthousePerformanceElement.getProperty(
    //             'innerText'
    //         );
    //         lighthousePerformanceElement = await lighthousePerformanceElement.jsonValue();
    //         lighthousePerformanceElement.should.endWith('%');
    //         done();
    //     },
    //     operationTimeOut
    // );

    // test(
    //     'should display multiple probes and monitor chart on refresh',
    //     async done => {
    //         // Navigate to Component details
    //         await init.navigateToMonitorDetails(
    //             componentName,
    //             urlMonitorName,
    //             page
    //         );

    //         await page.reload({
    //             waitUntil: ['networkidle0', 'domcontentloaded'],
    //         });

    //         const probe0 = await init.pageWaitForSelector(page, '#probes-btn0');
    //         const probe1 = await init.pageWaitForSelector(page, '#probes-btn1');

    //         expect(probe0).toBeDefined();
    //         expect(probe1).toBeDefined();

    //         const monitorStatus = await init.pageWaitForSelector(
    //             page,
    //             `#monitor-status-${urlMonitorName}`,
    //             { visible: true, timeout: operationTimeOut }
    //         );
    //         const sslStatus = await init.pageWaitForSelector(
    //             page,
    //             `#ssl-status-${urlMonitorName}`,
    //             { visible: true, timeout: operationTimeOut }
    //         );

    //         expect(monitorStatus).toBeDefined();
    //         expect(sslStatus).toBeDefined();
    //         done();
    //     },
    //     operationTimeOut
    // );

    // test(
    //     'Should navigate to monitor details and get lighthouse scores and website issues',
    //     async done => {
    //         // Navigate to Monitor details
    //         await init.navigateToMonitorDetails(
    //             componentName,
    //             urlMonitorName,
    //             page
    //         );

    //         const createdLighthouseLogsSelector = '.lighthouseLogsListItem';
    //         await init.pageWaitForSelector(page, createdLighthouseLogsSelector);
    //         await init.page$Eval(page, createdLighthouseLogsSelector, e =>
    //             e.click()
    //         );

    //         let lighthousePerformanceElement = await init.pageWaitForSelector(
    //             page,
    //             `#lighthouse-performance-${urlMonitorName}`,
    //             { visible: true, timeout: init.timeout }
    //         );
    //         lighthousePerformanceElement = await lighthousePerformanceElement.getProperty(
    //             'innerText'
    //         );
    //         lighthousePerformanceElement = await lighthousePerformanceElement.jsonValue();
    //         lighthousePerformanceElement.should.endWith('%');

    //         let lighthouseAccessibilityElement = await init.pageWaitForSelector(
    //             page,
    //             `#lighthouse-availability-${urlMonitorName}`,
    //             { visible: true, timeout: init.timeout }
    //         );
    //         lighthouseAccessibilityElement = await lighthouseAccessibilityElement.getProperty(
    //             'innerText'
    //         );
    //         lighthouseAccessibilityElement = await lighthouseAccessibilityElement.jsonValue();
    //         lighthouseAccessibilityElement.should.endWith('%');

    //         let lighthouseBestPracticesElement = await init.pageWaitForSelector(
    //             page,
    //             `#lighthouse-bestPractices-${urlMonitorName}`,
    //             { visible: true, timeout: init.timeout }
    //         );
    //         lighthouseBestPracticesElement = await lighthouseBestPracticesElement.getProperty(
    //             'innerText'
    //         );
    //         lighthouseBestPracticesElement = await lighthouseBestPracticesElement.jsonValue();
    //         lighthouseBestPracticesElement.should.endWith('%');

    //         let lighthouseSeoElement = await init.pageWaitForSelector(
    //             page,
    //             `#lighthouse-seo-${urlMonitorName}`,
    //             { visible: true, timeout: init.timeout }
    //         );
    //         lighthouseSeoElement = await lighthouseSeoElement.getProperty(
    //             'innerText'
    //         );
    //         lighthouseSeoElement = await lighthouseSeoElement.jsonValue();
    //         lighthouseSeoElement.should.endWith('%');

    //         let lighthousePwaElement = await init.pageWaitForSelector(
    //             page,
    //             `#lighthouse-pwa-${urlMonitorName}`,
    //             { visible: true, timeout: init.timeout }
    //         );
    //         lighthousePwaElement = await lighthousePwaElement.getProperty(
    //             'innerText'
    //         );
    //         lighthousePwaElement = await lighthousePwaElement.jsonValue();
    //         lighthousePwaElement.should.endWith('%');

    //         const websiteIssuesSelector =
    //             '#performance #websiteIssuesList > tbody >tr.websiteIssuesListItem';
    //         await init.pageWaitForSelector(page, websiteIssuesSelector);

    //         const websiteIssuesRows = await init.page$$(
    //             page,
    //             websiteIssuesSelector
    //         );
    //         const countWebsiteIssues = websiteIssuesRows.length;

    //         expect(countWebsiteIssues).toBeGreaterThanOrEqual(1);
    //         done();
    //     },
    //     operationTimeOut
    // );

    // test(
    //     'Should navigate to monitor details and edit monitor',
    //     async done => {
    //         // Navigate to Monitor details
    //         await init.navigateToMonitorDetails(
    //             componentName,
    //             monitorName,
    //             page
    //         );

    //         const editButtonSelector = `#edit_${monitorName}`;
    //         await init.pageWaitForSelector(page, editButtonSelector, {
    //             visible: true,
    //             timeout: init.timeout,
    //         });
    //         await init.page$Eval(page, editButtonSelector, e => e.click());

    //         await init.pageWaitForSelector(page, '#form-new-monitor');
    //         await init.pageClick(page, 'input[id=name]');
    //         await init.pageType(page, 'input[id=name]', newMonitorName);
    //         await init.page$Eval(page, 'button[type=submit]', e => e.click());
    //         await init.pageWaitForSelector(page, '#form-new-monitor', {
    //             hidden: true,
    //         });

    //         const selector = `#monitor-title-${newMonitorName}`;

    //         let spanElement = await init.pageWaitForSelector(page, selector);
    //         spanElement = await spanElement.getProperty('innerText');
    //         spanElement = await spanElement.jsonValue();

    //         spanElement.should.be.exactly(newMonitorName);
    //         done();
    //     },
    //     operationTimeOut
    // );

    // test(
    //     'Should navigate to monitor details and delete monitor',
    //     async done => {
    //         // Navigate to Monitor details
    //         await init.navigateToMonitorDetails(
    //             componentName,
    //             newMonitorName,
    //             page
    //         );
    //         // click on advanced tab
    //         await init.gotoTab(utils.monitorTabIndexes.ADVANCE, page);

    //         const deleteButtonSelector = `#delete_${newMonitorName}`;
    //         await init.page$Eval(page, deleteButtonSelector, e => e.click());

    //         const confirmDeleteButtonSelector = '#deleteMonitor';
    //         await init.pageWaitForSelector(page, confirmDeleteButtonSelector);
    //         await init.page$Eval(page, confirmDeleteButtonSelector, e =>
    //             e.click()
    //         );
    //         await init.pageWaitForSelector(page, confirmDeleteButtonSelector, {
    //             hidden: true,
    //         });

    //         const selector = `span#monitor-title-${newMonitorName}`;

    //         const spanElement = await init.page$(page, selector);
    //         expect(spanElement).toEqual(null);
    //         done();
    //     },
    //     operationTimeOut
    // );
});
