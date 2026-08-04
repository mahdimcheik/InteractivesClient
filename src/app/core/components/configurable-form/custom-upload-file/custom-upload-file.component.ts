import { CommonModule } from '@angular/common';
import { Component, OnInit, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UploaderModule } from '@syncfusion/ej2-angular-inputs';
import { TooltipModule } from '@syncfusion/ej2-angular-popups';
import type { SelectedEventArgs } from '@syncfusion/ej2-inputs';

@Component({
    selector: 'bp-custom-upload-file',
    standalone: true,
    imports: [CommonModule, UploaderModule, TooltipModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CustomUploadFileComponent),
            multi: true
        }
    ],
    template: `
        <ejs-uploader
            #uploader
            [id]="id()"
            [buttons]="{ browse: chooseLabel(), clear: cancelLabel() }"
            [multiple]="multiple()"
            [allowedExtensions]="accept() === '*' ? '' : accept()"
            [maxFileSize]="maxFileSize()"
            [autoUpload]="false"
            [enabled]="!disabled()"
            (selected)="onSelected($event)"
            (removing)="onClear()"
            (clearing)="onClear()"
            class="w-full"
            [class.field-invalid]="invalid()"
        >
        </ejs-uploader>

        <div class="text-center p-4 text-gray-500 flex flex-row items-center justify-center rounded border border-dashed border-gray-300 mt-2">
            <span class="flex-1 text-center flex items-center justify-center">
                {{ emptyMessage() }}
            </span>
            @if (url() && 'jpg,jpeg,png,webp'.includes(extension())) {
                <div class="flex flex-col items-center ml-4 flex-1 justify-center">
                    <span>Votre avatar</span>
                    <img [src]="url()" alt="" class="mx-auto mt-2 max-h-24 object-contain border rounded-2" />
                </div>
            }
        </div>

        <div class="space-y-2 mt-2">
            @if (uploadedFiles(); as files) {
                @if (files.length > 0) {
                    @for (file of files; track file.name) {
                        <div class="flex items-center justify-between p-2 bg-gray-50 rounded border">
                            <div class="flex items-center space-x-4 w-[80%]">
                                <span class="text-sm truncate">{{ file.name }}</span>
                                <span class="text-xs text-gray-500">{{ file.size }} bytes</span>
                            </div>
                            <ejs-tooltip content="Annuler">
                                <i
                                    class="pi pi-times"
                                    (click)="remove(file); uploader.clearAll()"
                                ></i>
                            </ejs-tooltip>
                        </div>
                    }
                }
                @if (url() && files.length > 0 && 'jpg,jpeg,png,webp'.includes(extension())) {
                    <div class="flex flex-col items-center mt-4">
                        <span class="mb-2">Aperçu:</span>
                        <img [src]="url()" alt="Preview" class="max-h-48 object-contain border rounded" />
                    </div>
                }
            }
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
                width: 100%;
            }

            ::ng-deep .field-invalid .e-file-select-wrap {
                border-color: #ef4444 !important;
            }
        `
    ]
})
export class CustomUploadFileComponent implements ControlValueAccessor, OnInit {
    // Input properties for file upload configuration
    id = input<string>('');
    name = input<string>('');
    accept = input<string>('*');
    multiple = input<boolean>(false);
    maxFileSize = input<number>(1000000);
    chooseLabel = input<string>('Choisir');
    uploadLabel = input<string>('Téléverser');
    cancelLabel = input<string>('Annuler');
    emptyMessage = input<string>('Sélectionnez et glissez vos fichiers ici');
    mode = input<'basic' | 'advanced'>('advanced');
    url = model<string>('');
    extension = signal<string>('');
    showUploadButton = input<boolean>(true);
    showCancelButton = input<boolean>(true);
    auto = input<boolean>(false);
    invalid = input<boolean>(false);

    // Internal state
    uploadedFiles = signal<File[]>([]);
    disabled = signal<boolean>(false);

    // ControlValueAccessor callbacks
    private onChange = (value: File | File[] | null) => {};
    private onTouched = () => {};

    ngOnInit() {
        // Initialize empty files array
        this.uploadedFiles.set([]);
    }

    // ControlValueAccessor implementation
    writeValue(value: File | File[] | null): void {
        if (value === null || value === undefined) {
            this.uploadedFiles.set([]);
        } else if (Array.isArray(value)) {
            this.uploadedFiles.set(value);
        } else {
            this.uploadedFiles.set([value]);
        }
    }

    registerOnChange(fn: (value: File | File[] | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    // Syncfusion Uploader event handler
    onSelected(event: SelectedEventArgs) {
        const files = event.filesData
            .map((fileInfo) => fileInfo.rawFile)
            .filter((rawFile): rawFile is File => rawFile instanceof File);
        this.handleFileChange(this.multiple() ? [...this.uploadedFiles(), ...files] : files);
    }

    remove(file?: File) {
        if (!file) {
            this.handleFileChange([]);
            return;
        }
        this.handleFileChange(this.uploadedFiles().filter((f) => f !== file));
    }

    onClear() {
        this.handleFileChange([]);
    }

    private handleFileChange(files: File[]) {
        this.uploadedFiles.set(files);
        this.onTouched();

        // Emit the appropriate value based on multiple flag
        if (this.multiple()) {
            this.onChange(files.length > 0 ? files : null);
        } else {
            this.onChange(files.length > 0 ? files[0] : null);
            this.extension.set(files[0] ? files[0].name.split('.').pop()!.toLowerCase() : '');
            this.url.set(files[0] ? URL.createObjectURL(files[0]) : 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/250px-User_icon_2.svg.png');
        }
    }

    // Helper methods
    getFiles(): File[] {
        return this.uploadedFiles();
    }

    hasFiles(): boolean {
        return this.uploadedFiles().length > 0;
    }

    clearFiles(): void {
        this.handleFileChange([]);
    }
}
