import chalk from "chalk";
import * as path from "path";

import { AutoMutatorFactory, IMutationsProviderFactory } from "./autoMutatorFactory";
import { describeTests } from "./describeTests";
import { HierarchyCrawler, IHierarchy } from "./hierarchyCrawler";
import { ITestCaseSettings, runTestCase } from "./testCase";

/**
 * Settings to describe test cases, namely file names and CLI flag equivalents.
 */
export interface ITestDescriptionSettings extends ITestCaseSettings {
    /**
     * Wildcard(s) of tests to run.
     */
    includes?: RegExp[];
}

/**
 * Creates tests for provided cases.
 *
 * @deprecated   Use {@link describeMutationTestCases} instead.
 */
export class TestsFactory {
    /**
     * Creates test cases from test case settings.
     */
    private readonly autoMutatorFactory: AutoMutatorFactory;

    /**
     * Generates a directory-based test hierarchy from the file system.
     */
    private readonly hierarchyCrawler: HierarchyCrawler;

    /**
     * Settings for the test cases.
     */
    private readonly settings: ITestDescriptionSettings;

    /**
     * Initializes a new instance of the TestsFactory class.
     *
     * @param mutationsProviderFactory   Creates test cases from test case settings.
     * @param extension   File extension of test case files.
     */
    public constructor(mutationsProviderFactory: IMutationsProviderFactory, settings: ITestDescriptionSettings) {
        this.autoMutatorFactory = new AutoMutatorFactory(mutationsProviderFactory);
        this.settings = settings;

        this.hierarchyCrawler = new HierarchyCrawler(this.settings.original);
    }

    /**
     * Describes tests for the cases directory.
     *
     * @param casesPath   Path to the test cases.
     */
    public describe(casesPath: string): void {
        if (this.settings.includes !== undefined && this.settings.includes.length !== 0) {
            console.log(
                "Including only tests that match any of:\n - ",
                chalk.cyan(this.settings.includes.join("\n - ")),
            );
        }

        describeTests(
            this.hierarchyCrawler.crawl("cases", casesPath),
            async (hierarchy: IHierarchy): Promise<void> => this.runTest(hierarchy),
            this.settings.includes,
        );
    }

    /**
     * Creates settings for a test case.
     *
     * @param casePath   Path to a test case.
     * @returns Settings for the test case.
     */
    private createTestCaseSettings(casePath: string): ITestCaseSettings {
        return {
            accept: this.settings.accept,
            actual: path.join(casePath, this.settings.actual),
            expected: path.join(casePath, this.settings.expected),
            original: path.join(casePath, this.settings.original),
            settings: path.join(casePath, this.settings.settings),
        };
    }

    /**
     * Creates and runs a test case.
     *
     * @param hierarchy   The case's hierarchy.
     * @returns A Promise for running the test.
     */
    private async runTest(hierarchy: IHierarchy): Promise<void> {
        await runTestCase(this.createTestCaseSettings(hierarchy.directoryPath), this.autoMutatorFactory);
    }
}

/**
 * @param casesPath   Path to the test cases.
 * @param mutationsProviderFactory   Creates test cases from test case settings.
 * @param settings   Settings to describe test cases, namely file names and CLI flag equivalents.
 */
export const describeMutationTestCases = (
    casesPath: string,
    mutationsProviderFactory: IMutationsProviderFactory,
    settings: ITestDescriptionSettings,
): void => {
    // tslint:disable-next-line:deprecation
    const testsFactory = new TestsFactory(mutationsProviderFactory, settings);

    testsFactory.describe(casesPath);
};
