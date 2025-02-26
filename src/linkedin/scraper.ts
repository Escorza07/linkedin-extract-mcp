import { ApifyClient } from 'apify-client';
import { LinkedInProfile, ExtractProfileResult } from '../types.js';
import { APIFY_TOKEN, LINKEDIN_SCRAPER_ACTOR_ID, DEFAULT_TIMEOUT, URL_REGEX, ERROR_MESSAGES } from '../config.js';

export class LinkedInScraper {
  private client: ApifyClient;

  constructor() {
    this.client = new ApifyClient({
      token: APIFY_TOKEN,
    });
  }

  private validateUrl(url: string): void {
    if (!URL_REGEX.test(url)) {
      throw new Error(ERROR_MESSAGES.INVALID_URL);
    }
  }

  private transformProfileData(rawData: any): LinkedInProfile {
    try {
      if (!rawData || typeof rawData !== 'object') {
        throw new Error('Invalid raw profile data');
      }

      const profile: LinkedInProfile = {
        basicInfo: {
          name: this.sanitizeString(rawData.fullName),
          headline: this.sanitizeString(rawData.headline),
          location: this.sanitizeString(rawData.addressWithCountry),
          profileUrl: this.sanitizeString(rawData.linkedinUrl),
          summary: this.sanitizeString(rawData.about),
          imageUrl: this.sanitizeString(rawData.profilePicHighQuality || rawData.profilePic),
          email: this.sanitizeString(rawData.email),
          connections: rawData.connections,
          followers: rawData.followers,
          openToConnect: rawData.openConnection,
        },
        company: {
          name: this.sanitizeString(rawData.companyName),
          industry: this.sanitizeString(rawData.companyIndustry),
          website: this.sanitizeString(rawData.companyWebsite),
          linkedinUrl: this.sanitizeString(rawData.companyLinkedin),
          foundedIn: rawData.companyFoundedIn,
          size: this.sanitizeString(rawData.companySize),
        },
        experience: this.transformExperiences(rawData.experiences),
        education: this.transformEducation(rawData.educations),
        skills: this.transformSkills(rawData.skills),
        languages: this.transformLanguages(rawData.languages),
        certifications: this.transformCertifications(rawData.licenseAndCertificates),
        recentUpdates: this.transformUpdates(rawData.updates),
      };

      return profile;
    } catch (error) {
      console.error('Error transforming profile data:', error);
      throw new Error(ERROR_MESSAGES.SCRAPING_ERROR);
    }
  }

  private sanitizeString(value: any): string {
    if (!value) return '';
    return String(value).trim();
  }

  private transformExperiences(experiences: any[]): LinkedInProfile['experience'] {
    if (!Array.isArray(experiences)) return [];

    interface Position {
      title: string;
      company: string;
      location?: string;
      dateRange?: { start: string; end: string };
      description?: string;
      companyId?: string;
      companyUrl?: string;
      logo?: string;
      subPositions?: Array<{
        title: string;
        dateRange?: { start: string; end: string };
        location?: string;
        description?: string;
      }>;
    }

    return experiences.map(exp => {
      const mainPosition: Position = {
        title: this.sanitizeString(exp?.title),
        company: this.sanitizeString(exp?.subtitle?.split('·')[0]),
        location: this.sanitizeString(exp?.metadata),
        dateRange: this.parseDateRange(exp?.caption || ''),
        description: this.sanitizeString(exp?.subComponents?.[0]?.description?.[0]?.text),
        companyId: this.sanitizeString(exp?.companyId),
        companyUrl: this.sanitizeString(exp?.companyLink1),
        logo: this.sanitizeString(exp?.logo),
      };

      if (exp.breakdown && Array.isArray(exp.subComponents)) {
        mainPosition.subPositions = exp.subComponents.map((sub: any) => ({
          title: this.sanitizeString(sub?.title),
          dateRange: this.parseDateRange(sub?.caption || ''),
          location: this.sanitizeString(sub?.metadata),
          description: Array.isArray(sub?.description) 
            ? sub.description.map((desc: any) => desc.text).join('\n')
            : '',
        }));
      }

      return mainPosition;
    });
  }

  private transformEducation(education: any[]): LinkedInProfile['education'] {
    if (!Array.isArray(education)) return [];

    return education.map(edu => {
      const descriptions = edu.subComponents?.[0]?.description || [];
      const activities = descriptions.find((desc: any) => 
        desc.text?.includes('Activities and societies:'))?.text?.replace('Activities and societies: ', '');
      const grade = descriptions.find((desc: any) => 
        desc.text?.includes('Grade:'))?.text?.replace('Grade: ', '');

      return {
        school: this.sanitizeString(edu?.title),
        degree: this.sanitizeString(edu?.subtitle),
        dateRange: this.parseDateRange(edu?.caption || ''),
        activities: this.sanitizeString(activities),
        grade: this.sanitizeString(grade),
        logo: this.sanitizeString(edu?.logo),
      };
    });
  }

  private transformSkills(skills: any[]): LinkedInProfile['skills'] {
    if (!Array.isArray(skills)) return [];
    
    return skills.map(skill => {
      const endorsements = skill.subComponents?.[0]?.description
        ?.filter((desc: any) => desc.type === 'insightComponent')
        ?.map((desc: any) => desc.text);

      const endorsementCount = endorsements?.find((text: string) => text.includes('endorsements'))
        ?.match(/(\d+) endorsements?/)?.[1];

      const endorsedByInfo = endorsements?.find((text: string) => text.includes('Endorsed by'))
        ?.match(/Endorsed by (.+?) who is highly skilled at this/);

      return {
        name: this.sanitizeString(skill?.title),
        endorsements: endorsementCount ? parseInt(endorsementCount) : undefined,
        endorsedBy: endorsedByInfo ? [{
          name: endorsedByInfo[1],
          isHighlySkilled: true
        }] : undefined
      };
    });
  }

  private transformLanguages(languages: any[]): LinkedInProfile['languages'] {
    if (!Array.isArray(languages)) return [];

    return languages.map(lang => ({
      name: this.sanitizeString(lang?.title),
      proficiency: this.sanitizeString(lang?.caption),
    }));
  }

  private transformCertifications(certs: any[]): LinkedInProfile['certifications'] {
    if (!Array.isArray(certs)) return [];

    return certs.map(cert => ({
      name: this.sanitizeString(cert?.title),
      issuer: this.sanitizeString(cert?.subtitle),
      issueDate: this.sanitizeString(cert?.caption?.replace('Issued ', '')),
      expirationDate: '',
    }));
  }

  private transformUpdates(updates: any[]): LinkedInProfile['recentUpdates'] {
    if (!Array.isArray(updates)) return [];

    return updates.map(update => ({
      text: this.sanitizeString(update?.postText),
      image: this.sanitizeString(update?.image),
      link: this.sanitizeString(update?.postLink),
      likes: update?.numLikes,
      comments: update?.numComments,
      reactions: update?.reactionTypeCounts?.map((reaction: any) => ({
        type: this.sanitizeString(reaction?.reactionType),
        count: reaction?.count,
      })),
    }));
  }

  private parseDateRange(dateString: string): { start: string; end: string } {
    try {
      if (!dateString) return { start: '', end: '' };
      
      const parts = dateString.split('·')[0].split('-').map(s => s?.trim() || '');
      return {
        start: parts[0] || '',
        end: parts[1] || 'Present',
      };
    } catch (error) {
      console.error('Error parsing date range:', error);
      return { start: '', end: '' };
    }
  }

  async extractProfile(profileUrl: string): Promise<ExtractProfileResult> {
    try {
      this.validateUrl(profileUrl);

      const run = await this.client.actor(LINKEDIN_SCRAPER_ACTOR_ID).call({
        profileUrls: [profileUrl]
      });

      const dataset = await this.client.dataset(run.defaultDatasetId).listItems();
      
      if (!dataset.items.length) {
        throw new Error(ERROR_MESSAGES.NOT_FOUND);
      }

      const rawProfile = dataset.items[0];
      
      // Sanitizar datos crudos antes de la transformación
      const sanitizedRawProfile = JSON.parse(JSON.stringify(rawProfile));
      
      // Transformar y validar el perfil
      const profile = this.transformProfileData(sanitizedRawProfile);
      
      // Validación final de la estructura
      if (!profile.basicInfo || typeof profile.basicInfo !== 'object') {
        throw new Error('Estructura de perfil inválida: basicInfo faltante o inválido');
      }
      
      // Sanitización final del objeto completo
      return {
        profile: JSON.parse(JSON.stringify(profile)),
        rawData: rawProfile
      };
    } catch (error) {
      console.error('Error extracting profile:', error);
      throw error;
    }
  }
}
