import axios from 'axios';

// Use environment variable or relative path for production
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

export const getPosts = async () => {
    const response = await api.get('/posts');
    return response.data;
};

export const createPost = async (postData) => {
    const response = await api.post('/posts', postData);
    return response.data;
};

export const deletePost = async (id) => {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
};
