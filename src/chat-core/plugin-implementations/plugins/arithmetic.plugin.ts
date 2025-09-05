
import { AgentPluginBase } from '../../agent-plugin/agent-plugin-base.service';
import { PluginInstanceReference } from '../../../model/shared-models/chat-core/plugin-instance-reference.model';
import { PluginSpecification } from '../../../model/shared-models/chat-core/plugin-specification.model';
import { LifetimeContributorPriorityTypes } from '../../lifetime-contributor-priorities.enum';
import { PluginAttachmentTarget } from '../../agent-plugin/agent-plugin-base.service';
import { ARITHMETIC_PLUGIN_TYPE_ID } from '../../../model/shared-models/chat-core/plugins/plugin-type-constants.data';
import { z } from 'zod';
import { tool } from '@langchain/core/tools';

export class ArithmeticPlugin extends AgentPluginBase {
    constructor(
        params: PluginInstanceReference | PluginSpecification
    ) {
        super(params);
    }

    agentUserManual?: string = undefined;
    readonly type = ARITHMETIC_PLUGIN_TYPE_ID;
    priority: LifetimeContributorPriorityTypes = LifetimeContributorPriorityTypes.Normal;

    getTools() {
        const addSchema = {
            name: 'add',
            description: 'Add an array of numbers together. Always use this tool to perform addition. Do not perform addition yourself; always call this tool for any addition operation.',
            schema: z.object({
                numbers: z.array(z.number()).describe('Array of numbers to add.')
            })
        };
        const subtractSchema = {
            name: 'subtract',
            description: 'Subtract an array of numbers from the first number. Always use this tool to perform subtraction. Do not perform subtraction yourself; always call this tool for any subtraction operation.',
            schema: z.object({
                numbers: z.array(z.number()).describe('Array of numbers. The first is the starting value, the rest are subtracted from it.')
            })
        };
        const multiplySchema = {
            name: 'multiply',
            description: 'Multiply two numbers. Always use this tool to perform multiplication. Do not perform multiplication yourself; always call this tool for any multiplication operation.',
            schema: z.object({
                a: z.number().describe('First number'),
                b: z.number().describe('Second number')
            })
        };
        const divideSchema = {
            name: 'divide',
            description: 'Divide two numbers. Always use this tool to perform division. Do not perform division yourself; always call this tool for any division operation.',
            schema: z.object({
                a: z.number().describe('Numerator'),
                b: z.number().describe('Denominator')
            })
        };

        return [
            tool(
                async (options: z.infer<typeof addSchema.schema>) => {
                    return Array.isArray(options.numbers) ? options.numbers.reduce((sum, n) => sum + n, 0) : 0;
                },
                addSchema
            ),
            tool(
                async (options: z.infer<typeof subtractSchema.schema>) => {
                    if (!Array.isArray(options.numbers) || options.numbers.length === 0) {
                        return 0;
                    }
                    return options.numbers.slice(1).reduce((result, n) => result - n, options.numbers[0]);
                },
                subtractSchema
            ),
            tool(
                async (options: z.infer<typeof multiplySchema.schema>) => {
                    return options.a * options.b;
                },
                multiplySchema
            ),
            tool(
                async (options: z.infer<typeof divideSchema.schema>) => {
                    if (options.b === 0) {
                        throw new Error('Division by zero');
                    }
                    return options.a / options.b;
                },
                divideSchema
            )
        ];
    }
}
