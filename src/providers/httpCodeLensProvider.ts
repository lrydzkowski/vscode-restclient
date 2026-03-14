import { CancellationToken, CodeLens, CodeLensProvider, Command, Disposable, Event, EventEmitter, Range, TextDocument } from 'vscode';
import * as Constants from '../common/constants';
import { EnvironmentController } from '../controllers/environmentController';
import { SystemSettings } from '../models/configurationSettings';
import { Selector } from '../utils/selector';

export class HttpCodeLensProvider implements CodeLensProvider, Disposable {
    private readonly _onDidChangeCodeLenses = new EventEmitter<void>();
    public readonly onDidChangeCodeLenses: Event<void> = this._onDidChangeCodeLenses.event;

    private readonly disposables: Disposable[] = [];

    constructor() {
        this.disposables.push(
            EnvironmentController.onDidChangeEnvironment(() => this._onDidChangeCodeLenses.fire()),
            SystemSettings.Instance.onDidChangeConfiguration(() => this._onDidChangeCodeLenses.fire())
        );
    }

    public async provideCodeLenses(document: TextDocument, token: CancellationToken): Promise<CodeLens[]> {
        const blocks: CodeLens[] = [];
        const lines: string[] = document.getText().split(Constants.LineSplitterRegex);
        const requestRanges: [number, number][] = Selector.getRequestRanges(lines);

        const customButtons = await this.getCustomButtons();

        const env = await EnvironmentController.getCurrentEnvironment();
        const envLabel = `Env: ${env.name === Constants.NoEnvironmentSelectedName ? 'None' : env.name}`;

        for (const [blockStart, blockEnd] of requestRanges) {
            const range = new Range(blockStart, 0, blockEnd, 0);
            
            blocks.push(new CodeLens(range, {
                title: envLabel,
                command: 'rest-client.switch-environment',
            }));

            const cmd: Command = {
                arguments: [document, range],
                title: 'Send Request',
                command: 'rest-client.request'
            };
            blocks.push(new CodeLens(range, cmd));

            for (const button of customButtons) {
                blocks.push(new CodeLens(range, {
                    title: button.label,
                    command: 'rest-client.custom-button',
                    arguments: [button.command]
                }));
            }
        }

        return blocks;
    }

    private async getCustomButtons(): Promise<Array<{ label: string; command: string }>> {
        const settings = SystemSettings.Instance;
        const allButtons = settings.customButtons;

        const shared = allButtons[EnvironmentController.sharedEnvironmentName] ?? [];

        const env = await EnvironmentController.getCurrentEnvironment();
        if (env.name === Constants.NoEnvironmentSelectedName) {
            return shared;
        }

        const envButtons = allButtons[env.name] ?? [];
        return [...shared, ...envButtons];
    }

    public dispose() {
        this.disposables.forEach(d => d.dispose());
        this._onDidChangeCodeLenses.dispose();
    }
}
