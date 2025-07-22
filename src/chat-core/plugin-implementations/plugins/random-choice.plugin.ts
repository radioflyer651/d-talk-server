import { AgentPluginBase } from "../../agent-plugin/agent-plugin-base.service";
import { IChatLifetimeContributor } from "../../chat-lifetime-contributor.interface";
import { RANDOM_CHOICE_PLUGIN_TYPE_ID } from "../../../model/shared-models/chat-core/plugins/plugin-type-constants.data";
import { PluginInstanceReference } from "../../../model/shared-models/chat-core/plugin-instance-reference.model";
import { PluginSpecification } from "../../../model/shared-models/chat-core/plugin-specification.model";
import { StructuredToolInterface, tool } from "@langchain/core/tools";
import { z } from "zod";

export class RandomChoicePlugin extends AgentPluginBase implements IChatLifetimeContributor {
    constructor(
        params: PluginInstanceReference<any> | PluginSpecification<any>
    ) {
        super(params);
    }

    agentUserManual = 'When asked to choose randomly, use the random_value tool to pick randomly for you.';

    readonly type = RANDOM_CHOICE_PLUGIN_TYPE_ID;

    async getTools(): Promise<StructuredToolInterface[]> {
        const randomChoiceToolSchema = {
            name: `random_value`,
            describe: `Provide an array of choices and a number N, and this tool will return N random choices from the array.`,
            schema: z.object({
                choices: z.array(z.string()).describe("Array of choices to select from."),
                numberToSelect: z.number().min(1).describe("Number of choices to return.")
            })
        };

        const randomChoiceTool = tool(
            async (options: z.infer<typeof randomChoiceToolSchema.schema>) => {
                const { choices, numberToSelect } = options;
                if (!Array.isArray(choices) || choices.length === 0) {
                    throw new Error("Choices array must not be empty.");
                }
                if (numberToSelect < 1 || numberToSelect > choices.length) {
                    throw new Error("numberToSelect must be between 1 and the length of choices array.");
                }
                // Shuffle and pick N
                const shuffled = choices.slice().sort(() => Math.random() - 0.5);
                return shuffled.slice(0, numberToSelect);
            },
            randomChoiceToolSchema
        );
        return [randomChoiceTool];
    }
}
