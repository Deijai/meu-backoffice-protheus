import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';

interface HeaderProps {
    title: string;
    subtitle?: string;
    showBackButton?: boolean;
    onBackPress?: () => void;
    rightElement?: React.ReactNode;
    leftElement?: React.ReactNode;
    backgroundColor?: string;
    titleColor?: string;
    variant?: 'default' | 'large' | 'centered';
}

export const Header: React.FC<HeaderProps> = ({
    title,
    subtitle,
    showBackButton = false,
    onBackPress,
    rightElement,
    leftElement,
    backgroundColor,
    titleColor,
    variant = 'default',
}) => {
    const { theme, isDark } = useThemeStore();
    const insets = useSafeAreaInsets();

    const headerBackgroundColor = backgroundColor || theme.colors.card;
    const headerTitleColor = titleColor || theme.colors.text;

    const paddingTop = Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0;

    return (
        <>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={headerBackgroundColor}
                translucent
            />
            <View
                style={[
                    styles.container,
                    {
                        backgroundColor: headerBackgroundColor,
                        paddingTop: paddingTop + 8,
                        borderBottomColor: theme.colors.border,
                    },
                    variant === 'large' && styles.largeContainer,
                ]}
            >
                <View style={styles.content}>
                    {/* Left Side */}
                    <View style={styles.leftSide}>
                        {showBackButton && (
                            <TouchableOpacity
                                onPress={onBackPress}
                                style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
                            </TouchableOpacity>
                        )}
                        {leftElement}
                    </View>

                    {/* Title */}
                    <View
                        style={[
                            styles.titleContainer,
                            variant === 'centered' && styles.centeredTitle,
                        ]}
                    >
                        <Text
                            style={[
                                styles.title,
                                { color: headerTitleColor },
                                variant === 'large' && styles.largeTitle,
                            ]}
                            numberOfLines={1}
                        >
                            {title}
                        </Text>
                        {subtitle && (
                            <Text
                                style={[
                                    styles.subtitle,
                                    { color: theme.colors.textSecondary },
                                ]}
                                numberOfLines={1}
                            >
                                {subtitle}
                            </Text>
                        )}
                    </View>

                    {/* Right Side */}
                    <View style={styles.rightSide}>
                        {rightElement}
                    </View>
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 1,
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    largeContainer: {
        paddingBottom: 20,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 44,
    },
    leftSide: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 0,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    titleContainer: {
        flex: 1,
        paddingHorizontal: 8,
    },
    centeredTitle: {
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'left',
    },
    largeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 2,
        textAlign: 'left',
    },
    rightSide: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 0,
    },
});