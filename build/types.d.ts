export interface LinkedInProfile {
    basicInfo: {
        name: string;
        headline: string;
        location: string;
        profileUrl: string;
        summary?: string;
        imageUrl?: string;
        email?: string;
        connections?: number;
        followers?: number;
        openToConnect?: boolean;
    };
    company?: {
        name?: string;
        industry?: string;
        website?: string;
        linkedinUrl?: string;
        foundedIn?: number;
        size?: string;
    };
    experience: Array<{
        title: string;
        company: string;
        location?: string;
        dateRange?: {
            start: string;
            end?: string;
        };
        description?: string;
        companyId?: string;
        companyUrl?: string;
        logo?: string;
        subPositions?: Array<{
            title: string;
            dateRange?: {
                start: string;
                end?: string;
            };
            location?: string;
            description?: string;
        }>;
    }>;
    education: Array<{
        school: string;
        degree?: string;
        field?: string;
        dateRange?: {
            start: string;
            end?: string;
        };
        activities?: string;
        grade?: string;
        logo?: string;
    }>;
    skills: Array<{
        name: string;
        endorsements?: number;
        endorsedBy?: Array<{
            name: string;
            isHighlySkilled?: boolean;
        }>;
    }>;
    languages?: Array<{
        name: string;
        proficiency?: string;
    }>;
    certifications?: Array<{
        name: string;
        issuer?: string;
        issueDate?: string;
        expirationDate?: string;
    }>;
    recentUpdates?: Array<{
        text?: string;
        image?: string;
        link?: string;
        likes?: number;
        comments?: number;
        reactions?: Array<{
            type: string;
            count: number;
        }>;
    }>;
}
export interface ExtractProfileArgs {
    profileUrl: string;
}
export interface ExtractProfileResult {
    profile: LinkedInProfile;
    rawData: any;
}
