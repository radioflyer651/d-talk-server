// NOTE: This is probably not needed with langchain.

import * as ResponseTypes from "openai/resources/responses/responses";

export type ResponseCreateParams = ResponseTypes.ResponseCreateParams;
export type Tool = ResponseTypes.Tool;
export type ResponseFunctionToolCall = ResponseTypes.ResponseFunctionToolCall;
export type FunctionCallOutput = ResponseTypes.ResponseInputItem.FunctionCallOutput;

export type ResponseOutputMessage = ResponseTypes.ResponseOutputMessage;
export type EasyInputMessage = ResponseTypes.EasyInputMessage;
export type Message = ResponseTypes.ResponseInputItem.Message;
export type ResponseInputMessageItem = ResponseTypes.ResponseInputMessageItem;

export type MessageType = ResponseOutputMessage | EasyInputMessage | Message | ResponseInputMessageItem;

export type FunctionTool = ResponseTypes.FunctionTool;
export type ResponseInputItem = ResponseTypes.ResponseInputItem;

// ----------------------------------------------------

