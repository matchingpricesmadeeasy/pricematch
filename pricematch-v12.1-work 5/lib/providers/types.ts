import type {ProductInput,Offer} from "../types";
export type ProviderResult={provider:string;offers:Offer[];warning?:string};
export interface RetailerProvider{name:string;search(input:ProductInput):Promise<ProviderResult>}