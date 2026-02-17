module.exports = {
    apps: [
        {
            name: 'html-taskboard-backend',
            script: 'dist/main.js',
            namespace: 'html-taskboard-backend',
            exec_mode: 'fork',
            instances: 1,
            watch: false,
            autorestart: false,
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],
};
