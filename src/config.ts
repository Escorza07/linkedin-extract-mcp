export const APIFY_TOKEN = process.env.APIFY_TOKEN;

if (!APIFY_TOKEN) {
  throw new Error('APIFY_TOKEN environment variable is required');
}

// ID del actor de LinkedIn Scraper en APIFY
export const LINKEDIN_SCRAPER_ACTOR_ID = 'dev_fusion~Linkedin-Profile-Scraper';

export const DEFAULT_TIMEOUT = 60000; // 60 segundos

export const ERROR_MESSAGES = {
  INVALID_URL: 'La URL proporcionada no es una URL válida de perfil de LinkedIn',
  SCRAPING_ERROR: 'Error al extraer datos del perfil de LinkedIn',
  TIMEOUT: 'La operación excedió el tiempo límite',
  NOT_FOUND: 'No se encontró el perfil de LinkedIn',
};

export const URL_REGEX = /^https:\/\/([\w]+\.)?linkedin\.com\/in\/[^\/]+\/?$/;
