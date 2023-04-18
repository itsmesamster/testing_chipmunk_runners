// tslint:disable

// We need to provide path to TypeScript types definitions
/// <reference path="../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../node_modules/@types/node/index.d.ts" />
import { initLogger } from './logger';
initLogger();
import { Session, Observe } from '../src/api/session';
import { IGrabbedElement } from '../src/interfaces/index';
import { createSampleFile, finish, runner } from './common';
import { readConfigurationFile } from './config';
import { utils } from 'platform/log';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const config = readConfigurationFile().get().tests.stream;
// ================================== IMPORTANT ==================================
// THIS TEST WILL BE IGNORED ON WINDOWS
// ===============================================================================
if (process.platform === 'win32') {
    console.log(`${'='.repeat(75)}`);
    console.log(`TESTING OF STREAMS (session.stream.spec) are ignored on WINDOWS`);
    console.log(`${'='.repeat(75)}`);
    describe('Stream', function () {
        it('dummy', function (done) {
            done();
        });
    });
} else {
    describe('Stream', function () {
        it(config.regular.list[1], function () {
            return runner(config.regular, 1, async (logger, done, collector) => {
                const session = await Session.create();
                // Set provider into debug mode
                session.debug(true);
                const stream = session.getStream();
                if (stream instanceof Error) {
                    finish(session, done, stream);
                    return;
                }
                const events = session.getEvents();
                if (events instanceof Error) {
                    finish(session, done, events);
                    return;
                }
                const tmpobj = createSampleFile(
                    5000,
                    logger,
                    (i: number) => `some line data: ${i}\n`,
                );
                stream
                    .observe(
                        Observe.DataSource.stream()
                            .process({
                                command: `less ${tmpobj.name}`,
                                cwd: process.cwd(),
                                envs: process.env as { [key: string]: string },
                            })
                            .text(),
                    )
                    .catch(finish.bind(null, session, done));
                events.StreamUpdated.subscribe((rows: number) => {
                    if (rows < 5000) {
                        return;
                    }
                    stream
                        .grab(500, 7)
                        .then((result: IGrabbedElement[]) => {
                            logger.debug('result of grab was: ' + JSON.stringify(result));
                            expect(result.map((i) => i.content)).toEqual([
                                'some line data: 500',
                                'some line data: 501',
                                'some line data: 502',
                                'some line data: 503',
                                'some line data: 504',
                                'some line data: 505',
                                'some line data: 506',
                            ]);
                            finish(session, done);
                        })
                        .catch((err: Error) => {
                            finish(
                                session,
                                done,
                                new Error(
                                    `Fail to grab data due error: ${
                                        err instanceof Error ? err.message : err
                                    }`,
                                ),
                            );
                        });
                });
            });
        });

        it(config.regular.list[2], function () {
            return runner(config.regular, 2, async (logger, done, collector) => {
                const session = await Session.create();
                // Set provider into debug mode
                session.debug(true);
                const stream = session.getStream();
                if (stream instanceof Error) {
                    finish(session, done, stream);
                    return;
                }
                const events = session.getEvents();
                if (events instanceof Error) {
                    finish(session, done, events);
                    return;
                }
                const tmpobj = createSampleFile(
                    5000,
                    logger,
                    (i: number) => `some line data: ${i}\n`,
                );
                const lifeCycleEvents: string[] = [];
                stream
                    .observe(
                        Observe.DataSource.stream()
                            .process({
                                command: `less ${tmpobj.name}`,
                                cwd: process.cwd(),
                                envs: process.env as { [key: string]: string },
                            })
                            .text(),
                    )
                    .on('confirmed', () => {
                        lifeCycleEvents.push('confirmed');
                    })
                    .on('processing', () => {
                        lifeCycleEvents.push('processing');
                    })
                    .catch(finish.bind(null, session, done));
                events.StreamUpdated.subscribe((rows: number) => {
                    if (rows < 5000) {
                        return;
                    }
                    expect(lifeCycleEvents).toEqual(['confirmed', 'processing']);
                    finish(session, done);
                });
            });
        });

        it(config.regular.list[3], function () {
            return runner(config.regular, 3, async (logger, done, collector) => {
                const session = await Session.create();
                // Set provider into debug mode
                session.debug(true);
                const stream = session.getStream();
                if (stream instanceof Error) {
                    finish(session, done, stream);
                    return;
                }
                const events = session.getEvents();
                if (events instanceof Error) {
                    finish(session, done, events);
                    return;
                }
                const lifeCycleEvents: string[] = [];
                stream
                    .observe(
                        Observe.DataSource.stream()
                            .process({
                                command: `some_invalid_command`,
                                cwd: process.cwd(),
                                envs: process.env as { [key: string]: string },
                            })
                            .text(),
                    )
                    .on('confirmed', () => {
                        lifeCycleEvents.push('confirmed');
                    })
                    .on('processing', () => {
                        lifeCycleEvents.push('processing');
                    })
                    .then(() => {
                        finish(session, done, new Error(`Shound not be resolved`));
                    })
                    .catch((err: Error) => {
                        // Event 'processing' should not come, because stream was created (confirmed), but
                        // it cannot be processed as soon as command is invalid
                        expect(lifeCycleEvents).toEqual(['confirmed']);
                        finish(session, done);
                    });
            });
        });

        it(config.regular.list[4], function () {
            return runner(config.regular, 4, async (logger, done, collector) => {
                const session = await Session.create();
                // Set provider into debug mode
                session.debug(true);
                const stream = session.getStream();
                if (stream instanceof Error) {
                    finish(session, done, stream);
                    return;
                }
                const events = session.getEvents();
                if (events instanceof Error) {
                    finish(session, done, events);
                    return;
                }
                const tmpobj = createSampleFile(
                    5000,
                    logger,
                    (i: number) => `some line data: ${i}\n`,
                );
                stream
                    .observe(
                        Observe.DataSource.stream()
                            .process({
                                command: `tail --lines=5000 -f ${tmpobj.name}`,
                                cwd: process.cwd(),
                                envs: process.env as { [key: string]: string },
                            })
                            .text(),
                    )
                    .catch(finish.bind(null, session, done));
                const append = () => {
                    stream
                        .len()
                        .then((len) => {
                            expect(len).toBe(5000);
                            let chunk = [];
                            for (let i = 0; i < 5000; i += 1) {
                                chunk.push(`some line data: ${i}`);
                            }
                            fs.promises
                                .appendFile(tmpobj.name, `${'\n'}${chunk.join(`\n`)}`)
                                .then(() => {
                                    fs.closeSync(tmpobj.fd);
                                })
                                .catch((err: Error) => {
                                    finish(
                                        session,
                                        done,
                                        new Error(
                                            `Fail to grab data due error: ${
                                                err instanceof Error ? err.message : err
                                            }`,
                                        ),
                                    );
                                });
                        })
                        .catch((err: Error) => {
                            finish(
                                session,
                                done,
                                new Error(
                                    `Fail to grab data due error: ${
                                        err instanceof Error ? err.message : err
                                    }`,
                                ),
                            );
                        });
                };
                events.StreamUpdated.subscribe((rows: number) => {
                    if (rows === 5000) {
                        append();
                        return;
                    }
                    if (rows < 10000) {
                        return;
                    }
                    stream
                        .grab(500, 7)
                        .then((result: IGrabbedElement[]) => {
                            logger.debug('result of grab was: ' + JSON.stringify(result));
                            expect(result.map((i) => i.content)).toEqual([
                                'some line data: 500',
                                'some line data: 501',
                                'some line data: 502',
                                'some line data: 503',
                                'some line data: 504',
                                'some line data: 505',
                                'some line data: 506',
                            ]);
                            finish(session, done);
                        })
                        .catch((err: Error) => {
                            finish(
                                session,
                                done,
                                new Error(
                                    `Fail to grab data due error: ${
                                        err instanceof Error ? err.message : err
                                    }`,
                                ),
                            );
                        });
                });
            });
        });

        it(config.regular.list[5], function () {
            return runner(config.regular, 5, async (logger, done, collector) => {
                const session = await Session.create();
                // Set provider into debug mode
                session.debug(true);
                const stream = session.getStream();
                if (stream instanceof Error) {
                    finish(session, done, stream);
                    return;
                }
                const search = session.getSearch();
                if (search instanceof Error) {
                    finish(session, done, search);
                    return;
                }
                const events = session.getEvents();
                if (events instanceof Error) {
                    finish(session, done, events);
                    return;
                }
                const tmpobj = createSampleFile(
                    500,
                    logger,
                    (i: number) => `some line data: ${i}\n`,
                );
                stream
                    .observe(
                        Observe.DataSource.stream()
                            .process({
                                command: `tail --lines=5000 -f ${tmpobj.name}`,
                                cwd: process.cwd(),
                                envs: process.env as { [key: string]: string },
                            })
                            .text(),
                    )
                    .catch(finish.bind(null, session, done));
                const filter = 'match A';
                let expectedMatchesCount = 0;
                const append = () => {
                    stream
                        .len()
                        .then((len) => {
                            expect(len).toBe(500);
                            let chunk = [];
                            for (let i = 0; i < 500; i += 1) {
                                chunk.push(
                                    `some line data ${((n) => {
                                        if (n % 10 === 0) {
                                            expectedMatchesCount += 1;
                                            return filter;
                                        }
                                        return '';
                                    })(i)}: ${i}`,
                                );
                            }
                            fs.promises
                                .appendFile(tmpobj.name, `${'\n'}${chunk.join(`\n`)}`)
                                .then(() => {
                                    fs.closeSync(tmpobj.fd);
                                })
                                .catch((err: Error) => {
                                    finish(
                                        session,
                                        done,
                                        new Error(
                                            `Fail to grab data due error: ${
                                                err instanceof Error ? err.message : err
                                            }`,
                                        ),
                                    );
                                });
                        })
                        .catch((err: Error) => {
                            finish(
                                session,
                                done,
                                new Error(
                                    `Fail to grab data due error: ${
                                        err instanceof Error ? err.message : err
                                    }`,
                                ),
                            );
                        });
                };
                events.StreamUpdated.subscribe((rows: number) => {
                    if (rows === 500) {
                        search
                            .search([
                                {
                                    filter,
                                    flags: { reg: true, word: false, cases: false },
                                },
                            ])
                            .then(() => {
                                // We are appending new data only after search was done to make sure,
                                // updated search results will come
                                append();
                            })
                            .catch((err: Error) => {
                                finish(
                                    session,
                                    done,
                                    new Error(
                                        `Fail to search due error: ${
                                            err instanceof Error ? err.message : err
                                        }`,
                                    ),
                                );
                            });
                        return;
                    }
                });
                events.SearchUpdated.subscribe((updated) => {
                    if (updated.found <= 0) {
                        return;
                    }
                    expect(updated.found).toBe(expectedMatchesCount);
                    finish(session, done);
                });
            });
        });

        it(config.regular.list[6], function () {
            return runner(config.regular, 6, async (logger, done, collector) => {
                const session = await Session.create();
                // Set provider into debug mode
                session.debug(true);
                const stream = session.getStream();
                if (stream instanceof Error) {
                    finish(session, done, stream);
                    return;
                }
                const events = session.getEvents();
                if (events instanceof Error) {
                    finish(session, done, events);
                    return;
                }
                const tmpobj = createSampleFile(
                    5000,
                    logger,
                    (i: number) => `some line data: ${i}\n`,
                );
                const tailing = stream
                    .observe(
                        Observe.DataSource.stream()
                            .process({
                                command: `tail --lines=5000 -f ${tmpobj.name}`,
                                cwd: process.cwd(),
                                envs: process.env as { [key: string]: string },
                            })
                            .text(),
                    )
                    .catch(finish.bind(null, session, done));
                events.StreamUpdated.subscribe((rows: number) => {
                    if (rows < 5000) {
                        return;
                    }
                    tailing
                        .canceled(() => {
                            finish(session, done);
                        })
                        .abort();
                });
            });
        });

        it(config.regular.list[7], function () {
            return runner(config.regular, 7, async (logger, done, collector) => {
                const session = await Session.create();
                // Set provider into debug mode
                session.debug(true);
                const stream = session.getStream();
                if (stream instanceof Error) {
                    finish(session, done, stream);
                    return;
                }
                const events = session.getEvents();
                if (events instanceof Error) {
                    finish(session, done, events);
                    return;
                }
                const filename = path.join(os.tmpdir(), 'chipmunk_test_file.log');
                if (fs.existsSync(filename)) {
                    // We should drop content of file (if exists) to avoid "file truncated" error
                    // from tail side
                    fs.writeFileSync(filename, '');
                }
                let ready = 0;
                const sed = stream
                    .observe(
                        Observe.DataSource.stream()
                            .process({
                                command: `sed -u "w ${filename}"`,
                                cwd: process.cwd(),
                                envs: process.env as { [key: string]: string },
                            })
                            .text(),
                    )
                    .on('processing', (e) => {
                        procceed();
                    })
                    .catch(finish.bind(null, session, done));
                const _tail = stream
                    .observe(
                        Observe.DataSource.stream()
                            .process({
                                command: `tail -f ${filename}`,
                                cwd: process.cwd(),
                                envs: process.env as { [key: string]: string },
                            })
                            .text(),
                    )
                    .on('processing', () => {
                        procceed();
                    })
                    .catch(finish.bind(null, session, done));
                const TEST_LINES = ['test A', 'test B'];
                const procceed = async () => {
                    ready += 1;
                    if (ready < 2) {
                        return;
                    }
                    try {
                        // Send first message
                        await stream.sde(sed.uuid(), { WriteText: `${TEST_LINES[0]}\n` });
                        // Send second message
                        await stream.sde(sed.uuid(), { WriteText: `${TEST_LINES[1]}\n` });
                    } catch (e) {
                        finish(session, done, new Error(utils.error(e)));
                    }
                };
                events.StreamUpdated.subscribe((rows: number) => {
                    if (rows < 4) {
                        return;
                    }
                    stream
                        .grab(0, 4)
                        .then((result: IGrabbedElement[]) => {
                            console.log(result);
                            logger.debug('result of grab was: ' + JSON.stringify(result));
                            expect(result.map((i) => i.content)).toEqual([
                                TEST_LINES[0],
                                TEST_LINES[0],
                                TEST_LINES[1],
                                TEST_LINES[1],
                            ]);
                            finish(session, done);
                        })
                        .catch((err: Error) => {
                            finish(
                                session,
                                done,
                                new Error(
                                    `Fail to grab data due error: ${
                                        err instanceof Error ? err.message : err
                                    }`,
                                ),
                            );
                        });
                });
            });
        });
    });
}
