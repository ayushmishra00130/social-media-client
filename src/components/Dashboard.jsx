import React, { useState, useEffect } from 'react';
import API from '../api';
import { socket } from '../socket';

export default function Dashboard({ user, onLogout, onUpdateUser }) {
    const [posts, setPosts] = useState([]);
    const [text, setText] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'myPosts', 'profile'

    // Profile edit state
    const [profileData, setProfileData] = useState({
        name: user.name || '',
        bio: user.bio || '',
        profilePicUrl: user.profilePicUrl || ''
    });

    // Fetch posts on mount & setup socket listener
    useEffect(() => {
        fetchPosts();

        // Listen for real-time like updates from socket server
        socket.on('post_liked', (updatedPost) => {
            setPosts((prevPosts) =>
                prevPosts.map((p) => (p._id === updatedPost._id ? updatedPost : p))
            );
        });

        return () => {
            socket.off('post_liked');
        };
    }, []);

    const fetchPosts = async () => {
        try {
            const { data } = await API.get('/posts');
            setPosts(data);
        } catch (err) {
            console.error('Error fetching posts:', err);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        try {
            const { data } = await API.post('/posts', { text, imageUrl });
            setPosts([data, ...posts]);
            setText('');
            setImageUrl('');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create post');
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            await API.delete(`/posts/${postId}`);
            setPosts(posts.filter((p) => p._id !== postId));
        } catch (err) {
            alert(err.response?.data?.message || 'Unauthorized or failed to delete');
        }
    };

    const handleLike = (postId) => {
        // Emit socket event for real-time like toggle
        socket.emit('like_post', { postId, userId: user.id });
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.put('/auth/profile', profileData);
            localStorage.setItem('user', JSON.stringify({ ...user, ...data }));
            onUpdateUser({ ...user, ...data });
            alert('Profile updated successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update profile');
        }
    };

    // Filter posts based on tab
    const displayedPosts = activeTab === 'myPosts'
        ? posts.filter((p) => p.author?._id === user.id || p.author === user.id)
        : posts;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navbar */}
            <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-600">MiniSocial</h1>
                <div className="flex gap-4 items-center">
                    <button onClick={() => setActiveTab('feed')} className={`font-medium ${activeTab === 'feed' ? 'text-blue-600' : 'text-gray-600'}`}>Feed</button>
                    <button onClick={() => setActiveTab('myPosts')} className={`font-medium ${activeTab === 'myPosts' ? 'text-blue-600' : 'text-gray-600'}`}>My Posts</button>
                    <button onClick={() => setActiveTab('profile')} className={`font-medium ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-600'}`}>Profile</button>
                    <button onClick={onLogout} className="ml-4 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">Logout</button>
                </div>
            </nav>

            <div className="max-w-2xl mx-auto py-8 px-4">
                {activeTab === 'profile' ? (
                    /* Profile Edit View */
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-bold mb-4">View & Edit Profile</h2>
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email (Readonly)</label>
                                <input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Bio</label>
                                <textarea
                                    value={profileData.bio}
                                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Profile Picture URL</label>
                                <input
                                    type="text"
                                    value={profileData.profilePicUrl}
                                    onChange={(e) => setProfileData({ ...profileData, profilePicUrl: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                            </div>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Update Profile</button>
                        </form>
                    </div>
                ) : (
                    /* Feed / My Posts View */
                    <>
                        {/* Create Post Card */}
                        <div className="bg-white p-4 rounded-lg shadow mb-6">
                            <form onSubmit={handleCreatePost} className="space-y-3">
                                <textarea
                                    placeholder="What's on your mind?"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                />
                                <input
                                    type="text"
                                    placeholder="Image URL (optional)"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                />
                                <div className="flex justify-end">
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700">Post</button>
                                </div>
                            </form>
                        </div>

                        {/* Posts List */}
                        <div className="space-y-4">
                            {displayedPosts.length === 0 ? (
                                <p className="text-center text-gray-500">No posts found.</p>
                            ) : (
                                displayedPosts.map((post) => {
                                    const isLikedByMe = post.likes?.includes(user.id);
                                    const isOwner = (post.author?._id || post.author) === user.id;

                                    return (
                                        <div key={post._id} className="bg-white p-4 rounded-lg shadow">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                                        {post.author?.name ? post.author.name[0].toUpperCase() : 'U'}
                                                    </div>
                                                    <span className="font-semibold text-gray-800">{post.author?.name || 'User'}</span>
                                                </div>
                                                {isOwner && (
                                                    <button onClick={() => handleDeletePost(post._id)} className="text-red-500 text-sm hover:underline">Delete</button>
                                                )}
                                            </div>

                                            <p className="text-gray-700 mb-3">{post.text}</p>

                                            {post.imageUrl && (
                                                <img src={post.imageUrl} alt="Post media" className="w-full h-64 object-cover rounded-md mb-3" />
                                            )}

                                            <div className="flex items-center gap-4 text-sm text-gray-500 border-t pt-2">
                                                <button
                                                    onClick={() => handleLike(post._id)}
                                                    className={`flex items-center gap-1 font-medium ${isLikedByMe ? 'text-red-600' : 'text-gray-600 hover:text-red-600'}`}
                                                >
                                                    ❤️ {post.likes?.length || 0} Likes
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}