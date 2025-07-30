import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
    required?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    required = false,
    secureTextEntry,
    style,
    ...props
}) => {
    const { theme } = useThemeStore();
    const [isSecure, setIsSecure] = useState(secureTextEntry);
    const [isFocused, setIsFocused] = useState(false);

    const handleRightIconPress = () => {
        if (secureTextEntry) {
            setIsSecure(!isSecure);
        } else if (onRightIconPress) {
            onRightIconPress();
        }
    };

    const getRightIcon = () => {
        if (secureTextEntry) {
            return isSecure ? 'eye-off' : 'eye';
        }
        return rightIcon;
    };

    return (
        <View style={styles.container}>
            {label && (
                <Text style={[styles.label, { color: theme.colors.text }]}>
                    {label}
                    {required && <Text style={styles.required}> *</Text>}
                </Text>
            )}

            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: theme.colors.surface,
                        borderColor: error
                            ? theme.colors.error
                            : isFocused
                                ? '#0c9abe'
                                : theme.colors.border,
                    },
                    style,
                ]}
            >
                {leftIcon && (
                    <Ionicons
                        name={leftIcon}
                        size={20}
                        color={theme.colors.textSecondary}
                        style={styles.leftIcon}
                    />
                )}

                <TextInput
                    style={[
                        styles.input,
                        {
                            color: theme.colors.text,
                            flex: 1,
                        },
                    ]}
                    placeholderTextColor={theme.colors.placeholder}
                    secureTextEntry={isSecure}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />

                {(rightIcon || secureTextEntry) && (
                    <TouchableOpacity
                        onPress={handleRightIconPress}
                        style={styles.rightIcon}
                    >
                        <Ionicons
                            name={getRightIcon() as any}
                            size={20}
                            color={theme.colors.textSecondary}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {error && (
                <Text style={[styles.error, { color: theme.colors.error }]}>
                    {error}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    required: {
        color: '#e53e3e',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        minHeight: 48,
    },
    input: {
        fontSize: 16,
        paddingVertical: 12,
    },
    leftIcon: {
        marginRight: 8,
    },
    rightIcon: {
        marginLeft: 8,
        padding: 4,
    },
    error: {
        fontSize: 12,
        marginTop: 4,
    },
});