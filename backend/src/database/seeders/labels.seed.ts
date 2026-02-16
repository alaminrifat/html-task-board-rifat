import { DataSource } from 'typeorm';
import { Label } from 'src/modules/labels/label.entity';

export async function seedDefaultLabels(dataSource: DataSource): Promise<void> {
    const labelRepository = dataSource.getRepository(Label);

    // Check if system labels already exist (projectId IS NULL)
    const existingLabels = await labelRepository.count({
        where: { projectId: null as any },
    });

    if (existingLabels > 0) {
        console.log(
            `${existingLabels} system label(s) already exist in database`,
        );
        return;
    }

    console.log('Creating default system labels...');

    const labels: Partial<Label>[] = [
        { name: 'Bug', color: '#E53E3E', projectId: null },
        { name: 'Feature', color: '#3182CE', projectId: null },
        { name: 'Design', color: '#805AD5', projectId: null },
        { name: 'Documentation', color: '#38A169', projectId: null },
        { name: 'Improvement', color: '#DD6B20', projectId: null },
    ];

    for (const label of labels) {
        const entity = labelRepository.create(label);
        await labelRepository.save(entity);
    }

    console.log(`Successfully created ${labels.length} default labels`);
}
