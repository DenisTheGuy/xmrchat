export const useUtils = () => {
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatViewerCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const getInitials = (name: string): string => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string): Record<string, string> => {
    // Generate consistent color based on name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
      '#FF8A4C',
      '#FFB366',
      '#FF6B2B',
      '#FFA860',
      '#FF9558',
    ];

    const colorIndex = Math.abs(hash) % colors.length;

    return {
      background: colors[colorIndex],
    };
  };

  return {
    truncateText,
    formatViewerCount,
    getInitials,
    getAvatarColor,
  };
};