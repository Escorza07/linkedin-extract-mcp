import { ExtractProfileResult } from '../types.js';
export declare class LinkedInScraper {
    private client;
    constructor();
    private validateUrl;
    private transformProfileData;
    private sanitizeString;
    private transformExperiences;
    private transformEducation;
    private transformSkills;
    private transformLanguages;
    private transformCertifications;
    private transformUpdates;
    private parseDateRange;
    extractProfile(profileUrl: string): Promise<ExtractProfileResult>;
}
