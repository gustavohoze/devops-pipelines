import logger from "#config/logger.js"
import bcrypt from "bcrypt";
import db from "#config/database.js";
import { eq } from "drizzle-orm";
import { users } from "#models/user.model.js";

export const hashPassword = async (password) => {
    try{
        return await bcrypt.hash(password, 10);
    }catch(err){
        logger.error('Password hashing error:', err);
        throw new Error('Password hashing error');
    }
}

export const comparePassword = async (password, hashedPassword) => {
    try{
        return await bcrypt.compare(password, hashedPassword);
    }catch(err){
        logger.error('Password comparison error:', err);
        throw new Error('Password comparison error');
    }
}

export const createUser = async (name, email, password, role = 'user') => {
    try{
        const [existingUser] = await db.db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        const hashedPassword = await hashPassword(password);
        const [newUser] = await db.db
            .insert(users)
            .values({
                name,
                email,
                password: hashedPassword,
                role,
            })
            .returning({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                created_at: users.created_at,
            });

        logger.info(`User ${email} created successfully`);
        return newUser;
    }catch(err){
        logger.error('User creation error:', err);

        if (err.message === 'User with this email already exists') {
            throw err;
        }

        throw new Error('User creation error');
    }
}

export const authenticateUser = async (email, password) => {
    try{
        const [user] = await db.db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user) {
            throw new Error('User not found');
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        logger.info(`User ${email} authenticated successfully`);
        return user;
    }catch(err){
        logger.error('User authentication error:', err);

        if (err.message === 'User not found' || err.message === 'Invalid credentials') {
            throw err;
        }

        throw new Error('User authentication error');
    }
}
