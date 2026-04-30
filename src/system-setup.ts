import { updateInstructionMessages } from "./services/upgrade-services/instructions-v2.upgrade-services";



/** Handles misc setup and initialization of things like file folders and the like. */
export async function systemInitialization(): Promise<void> {
    // Setup the application here, if there are things to initialize.  This would typically be
    //  first time setup items, like making sure some folder exists or something.

    /** Update the messages for the agent instructions and chat job instructions.
     *   This will add IDs to the messages, if they don't already exist. */
    await updateInstructionMessages();
}