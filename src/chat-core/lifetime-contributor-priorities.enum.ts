
/** Provides an abstract way of defining the order that lifetime contributors get processed. */
export enum LifetimeContributorPriorityTypes {
    Room = -6,
    Agent = -5,
    Job = -4,
    AppendMetaData = -3,
    BeforeContextBuild = -2,
    WithLeastContext = -1,
    Normal = 0,
    WithHighestContext = 1,
    NearestToAgentCall = 2,
    Last = 900,
}