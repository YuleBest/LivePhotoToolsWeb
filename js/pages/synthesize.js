document.addEventListener('DOMContentLoaded', function() {
    // 设置文件预览
    setupFilePreview('staticImage');
    setupFilePreview('videoFile');

    // 获取DOM元素
    const synthesizeBtn = document.getElementById('synthesizeBtn');
    const downloadButtons = document.getElementById('downloadButtons');

    // 合成功能
    synthesizeBtn.addEventListener('click', async function() {
        const os = document.getElementById('synOS').value;
        const staticImage = document.getElementById('staticImage').files[0];
        const videoFile = document.getElementById('videoFile').files[0];

        if (!staticImage || !videoFile) {
            showResult('请选择静态图片和视频文件', true);
            return;
        }

        const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

        if (staticImage.size > MAX_FILE_SIZE || videoFile.size > MAX_FILE_SIZE) {
            showResult('文件太大，请选择小于100MB的文件', true);
            return;
        }

        if (!staticImage.type.startsWith('image/jpeg')) {
            showResult('静态图片必须是JPEG格式', true);
            return;
        }

        if (!videoFile.type.startsWith('video/mp4')) {
            showResult('视频必须是MP4格式', true);
            return;
        }

        try {
            showResult('处理中...');
            if (os === 'MIUI') {
                await synthesizeXiaomi(staticImage, videoFile);
            } else if (os === 'ColorOS') {
                await synthesizeOppo(staticImage, videoFile);
            }
        } catch (error) {
            showResult(`处理失败: ${error.message}`, true);
        }
    });

    // 下载按钮事件处理
    const downloadImage = document.getElementById('downloadImage');
    const downloadVideo = document.getElementById('downloadVideo');

    downloadImage.addEventListener('click', function() {
        if (window.separatedFiles?.imageData) {
            FileUtils.downloadFile(
                window.separatedFiles.imageData,
                `${window.separatedFiles.baseName}_image.jpg`
            );
            showResult('图片已开始下载');
        }
    });

    downloadVideo.addEventListener('click', function() {
        if (window.separatedFiles?.videoData) {
            FileUtils.downloadFile(
                window.separatedFiles.videoData,
                `${window.separatedFiles.baseName}_video.mp4`
            );
            showResult('视频已开始下载');
        }
    });
}); 