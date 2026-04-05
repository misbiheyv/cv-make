import pino from 'pino';

export const logger = pino({
	level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
	base: {
		service: 'cv-make',
		env: process.env.NODE_ENV ?? 'development',
	},
});

export function createLogger(component: string, requestId?: string) {
	const context: Record<string, string> = { component };

	if (requestId) {
		context.requestId = requestId;
	}

	return logger.child(context);
}
