// Imports
// ========================================================
import { generateNonce, SiweMessage } from 'siwe';
import { z } from 'zod';
import { router, publicProcedure } from "../../trpc";

// Router
// ========================================================
const AuthRouter = router({
    /**
     * Nonce
     */
    authNonce: publicProcedure.query(async ({ ctx }) => {
        // Get current date to setup session expiration
        const currentDate = new Date();

        // Setup Session
        ctx.req.session.nonce = generateNonce();
        ctx.req.session.issuedAt = currentDate.toISOString();
        ctx.req.session.expirationTime = new Date(
            currentDate.getTime() + 5 * 60 * 1000 // 5 minutes from the current time
        ).toISOString();

        // Save Session
        await ctx.req.session.save();

        // Return
        return {
            nonce: ctx.req.session.nonce,
            issuedAt: ctx.req.session.issuedAt,
            expirationTime: ctx.req.session.expirationTime
        }
    }),
    /**
     * Verify
     */
    authVerify: publicProcedure
        .input(z.object({
            message: z.object({
                domain: z.string(),
                address: z.string(),
                statement: z.string().optional(),
                uri: z.string(),
                version: z.string(),
                chainId: z.number(),
                nonce: z.string(),
                issuedAt: z.string(),
                expirationTime: z.string().optional(),
                notBefore: z.string().optional(),
                requestId: z.string().optional(),
                resources: z.array(z.string()).optional(),
                signature: z.string().optional(),
                type: z.literal("Personal signature").optional(),
            }),
            signature: z.string()
        }))
        .mutation(async (req) => {
            try {
                const siweMessage = new SiweMessage(req.input.message as SiweMessage);
                const fields = await siweMessage.validate(req.input.signature);

                // To access the express request to need to refer to ctx from the full request
                // As req.ctx.req
                if (fields.nonce !== req.ctx.req.session.nonce) {
                    throw new Error('Invalid nonce.');
                }

                req.ctx.req.session.siwe = fields;
                await req.ctx.req.session.save();
                return { ok: true };
            } catch (error: any) {
                return {
                    ok: false,
                    error: error?.message ?? 'Unknown error'
                }
            }
        }),
    /**
     * Me
     */
    authMe: publicProcedure.query(async ({ ctx }) => {
        return { address: ctx.req.session.siwe?.address }
    }),
    /**
     * Logout
     */
    authLogout: publicProcedure.query(async ({ ctx }) => {
        ctx.req.session.destroy();
        return { ok: true };
    })
});

// Exports
// ========================================================
export default AuthRouter;