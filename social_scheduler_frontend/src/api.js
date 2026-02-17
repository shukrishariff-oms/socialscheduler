import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
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
