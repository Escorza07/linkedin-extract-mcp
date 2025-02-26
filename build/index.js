#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { LinkedInScraper } from './linkedin/scraper.js';
class LinkedInExtractServer {
    constructor() {
        this.server = new Server({
            name: 'linkedin-extract-mcp',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.scraper = new LinkedInScraper();
        this.setupToolHandlers();
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'extract_profile',
                    description: 'Extrae información detallada de un perfil de LinkedIn usando APIFY',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            profileUrl: {
                                type: 'string',
                                description: 'URL del perfil de LinkedIn (formato: https://www.linkedin.com/in/username)',
                            },
                        },
                        required: ['profileUrl'],
                        additionalProperties: false,
                    },
                },
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            if (request.params.name !== 'extract_profile') {
                throw new McpError(ErrorCode.MethodNotFound, `Herramienta desconocida: ${request.params.name}`);
            }
            if (!request.params.arguments || typeof request.params.arguments.profileUrl !== 'string') {
                throw new McpError(ErrorCode.InvalidParams, 'Se requiere una URL de perfil válida');
            }
            const args = {
                profileUrl: request.params.arguments.profileUrl
            };
            try {
                const { profile, rawData } = await this.scraper.extractProfile(args.profileUrl);
                // Validar que el perfil sea un objeto válido antes de convertirlo a JSON
                if (!profile || typeof profile !== 'object') {
                    throw new Error('Datos de perfil inválidos');
                }
                // Sanitizar el objeto antes de convertirlo a JSON
                const sanitizedProfile = JSON.parse(JSON.stringify(profile));
                return {
                    content: [
                        {
                            type: 'text',
                            text: `CAMPOS DISPONIBLES EN DATOS CRUDOS:\n${JSON.stringify(Object.keys(rawData), null, 2)}\n\nDATOS CRUDOS COMPLETOS:\n${JSON.stringify(rawData, null, 2)}\n\nDATOS TRANSFORMADOS:\n${JSON.stringify(sanitizedProfile, null, 2)}`,
                        },
                    ],
                };
            }
            catch (error) {
                console.error('Error procesando perfil:', error);
                const errorMessage = error instanceof Error
                    ? error.message
                    : 'Error desconocido al procesar el perfil';
                return {
                    content: [
                        {
                            type: 'text',
                            text: errorMessage,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Servidor MCP de LinkedIn Extract iniciado en stdio');
    }
}
const server = new LinkedInExtractServer();
server.run().catch(console.error);
