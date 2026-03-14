export enum PreviewOption {
    Full,
    Headers,
    Body,
    Exchange,
    ReverseExchange
}

export function fromString(value: string): PreviewOption {
    value = value.toLowerCase();
    switch (value) {
        case 'headers':
            return PreviewOption.Headers;
        case 'body':
            return PreviewOption.Body;
        case 'exchange':
            return PreviewOption.Exchange;
        case 'reverseexchange':
            return PreviewOption.ReverseExchange;
        case 'full':
        default:
            return PreviewOption.Full;
    }
}